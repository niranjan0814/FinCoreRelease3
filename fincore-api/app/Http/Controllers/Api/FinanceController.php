<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BranchExpense;
use App\Models\Transaction;
use App\Models\Receipt;
use App\Services\SoapTransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FinanceController extends Controller
{
    /**
     * Get branch expenses with transaction details.
     */
    public function getBranchTransactions(Request $request)
    {
        $branchId = $request->query('branch_id');
        $date = $request->query('date');
        $period = $request->query('period', 'day'); // day, month, year, all

        $query = BranchExpense::with(['transaction.staff', 'branch'])
            ->whereNotIn('expense_type', ['Loan Disbursement', 'Salary Payment']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($date && $period === 'day') {
            $query->whereDate('date', $date);
        } elseif ($date && $period === 'month') {
            $query->whereMonth('date', date('m', strtotime($date)))
                  ->whereYear('date', date('Y', strtotime($date)));
        } elseif ($date && $period === 'year') {
            $query->whereYear('date', date('Y', strtotime($date)));
        }

        $expenses = $query->orderBy('date', 'desc')->get();

        // Calculate Stats
        $totalInflow = $expenses->where('type', 'inflow')->sum('amount');
        $totalOutflow = $expenses->where('type', 'outflow')->sum('amount');
        
        // Cumulative Net Flow (Mocking starting balance + actuals)
        $openingBalance = 7500; 
        $netFlow = $openingBalance + $totalInflow - $totalOutflow;

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Branch transactions fetched successfully',
            'data' => [
                'activities' => $expenses,
                'stats' => [
                    'total_income' => $totalInflow,
                    'total_expense' => $totalOutflow,
                    'net_flow' => $netFlow,
                    'total_truncation' => $totalInflow + $totalOutflow
                ]
            ]
        ]);
    }

    /**
     * Store a new branch expense and create a master transaction.
     */
    public function storeBranchExpense(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|exists:branches,id',
            'staff_id' => 'required|exists:staffs,staff_id',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|in:inflow,outflow',
            'expense_type' => 'required|string',
            'medium' => 'required|string',
            'date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                // 1. SOAP API Authorization
                $soapService = new SoapTransactionService();
                $soapResponse = $soapService->authorizeTransaction([
                    'amount' => $request->amount,
                    'type' => $request->type,
                    'branch' => $request->branch_id,
                    'user' => $request->staff_id
                ]);

                if ($soapResponse['status'] !== 'success') {
                    throw new \Exception("External Authorization Failed: " . $soapResponse['message']);
                }

                // 2. Create the Transaction Record
                $transaction = Transaction::create([
                    'staff_id' => $request->staff_id,
                    'amount' => $request->amount,
                    'type' => $request->type,
                    'category' => 'branch_activity',
                    'status' => 'success',
                    'soap_ref_no' => $soapResponse['ref_no'],
                    'timestamp' => now(),
                ]);

                // 2. Create the Branch Expense record linked to the transaction
                $expense = BranchExpense::create([
                    'branch_id' => $request->branch_id,
                    'transaction_id' => $transaction->id,
                    'type' => $request->type,
                    'date' => $request->date,
                    'expense_type' => $request->expense_type,
                    'medium' => $request->medium,
                    'description' => $request->description,
                    'amount' => $request->amount,
                ]);

                // Update transaction with related_id
                $transaction->update(['related_id' => $expense->id]);

                return response()->json([
                    'statusCode' => 2000,
                    'message' => 'Branch activity recorded successfully',
                    'data' => $expense->load('transaction')
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 5000,
                'message' => 'Failed to record activity: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get receipts that are collected by field officers but not yet settled in branch.
     */
    public function getUnsettledReceipts(Request $request)
    {
        $branchId = $request->query('branch_id');
        $status = $request->query('status', 'active'); // active or settled

        $query = Receipt::with(['staff.staff', 'customer', 'loan'])
            ->where('status', $status);

        if ($branchId) {
            $query->whereHas('center', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        if ($status === 'active') {
            $query->whereDoesntHave('transaction');
        }

        $receipts = $query->latest()->get();

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Receipts fetched successfully',
            'data' => $receipts
        ]);
    }

    /**
     * Settle a field collection receipt into the branch ledger.
     */
    public function settleReceipt(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receipt_id' => 'required|exists:receipts,id',
            'staff_id' => 'required|exists:staffs,staff_id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $receipt = Receipt::findOrFail($request->receipt_id);
                
                // 1. SOAP API Authorization
                $soapService = new SoapTransactionService();
                $soapResponse = $soapService->authorizeTransaction([
                    'amount' => $receipt->current_due_amount,
                    'type' => 'inflow',
                    'ref' => $receipt->receipt_id,
                    'user' => $request->staff_id
                ]);

                if ($soapResponse['status'] !== 'success') {
                    throw new \Exception("External Authorization Failed: " . $soapResponse['message']);
                }

                // 2. Create Transaction
                $transaction = Transaction::create([
                    'staff_id' => $request->staff_id,
                    'amount' => $receipt->current_due_amount,
                    'type' => 'inflow',
                    'category' => 'collection',
                    'related_id' => $receipt->id,
                    'status' => 'success',
                    'soap_ref_no' => $soapResponse['ref_no'],
                    'timestamp' => now(),
                ]);

                // 3. Update Receipt Status
                $receipt->update(['status' => 'settled']);

                // 4. Record in BranchExpense (as an inflow)
                BranchExpense::create([
                    'branch_id' => $receipt->center->branch_id,
                    'transaction_id' => $transaction->id,
                    'type' => 'inflow',
                    'date' => now()->toDateString(),
                    'expense_type' => 'Loan Collection',
                    'medium' => 'Cash',
                    'description' => "Settled Loan Collection: Receipt #{$receipt->receipt_id}",
                    'amount' => $receipt->current_due_amount,
                ]);

                return response()->json([
                    'statusCode' => 2000,
                    'message' => 'Receipt settled successfully',
                    'data' => $receipt
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 5000,
                'message' => 'Failed to settle receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get loans that are fully approved but not yet disbursed.
     */
    public function getApprovedLoans(Request $request)
    {
        $branchId = $request->query('branch_id');

        $query = \App\Models\Loan::with(['customer', 'product', 'center.branch'])
            ->where('status', \App\Models\Loan::STATUS_APPROVED);

        if ($branchId) {
            $query->whereHas('center', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $loans = $query->latest()->get();

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Approved loans fetched successfully',
            'data' => $loans
        ]);
    }

    /**
     * Get salaries that are processed but not yet disbursed.
     */
    public function getPendingSalaries(Request $request)
    {
        $branchId = $request->query('branch_id');

        $query = \App\Models\SalaryPayment::with(['staff.branch'])
            ->where('status', 'Pending');

        if ($branchId) {
            $query->whereHas('staff', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $salaries = $query->latest()->get();

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Pending salaries fetched successfully',
            'data' => $salaries
        ]);
    }

    /**
     * Disburse a salary payment.
     */
    public function disburseSalary(Request $request, $id)
    {
        try {
            return DB::transaction(function () use ($request, $id) {
                $salary = \App\Models\SalaryPayment::with(['staff.branch'])->findOrFail($id);

                if ($salary->status !== 'Pending') {
                    return response()->json([
                        'statusCode' => 4220,
                        'message' => 'Only pending salaries can be disbursed.'
                    ], 422);
                }

                $user = auth()->user();

                // 1. Update Status
                $salary->update([
                    'status' => 'Paid',
                    'payment_date' => now()
                ]);

                // 2. Create Transaction (Outflow)
                $transaction = Transaction::create([
                    'staff_id' => $user->user_name,
                    'amount' => $salary->net_payable,
                    'type' => 'outflow',
                    'category' => 'salary_payment',
                    'status' => 'success',
                    'related_id' => $salary->id,
                    'timestamp' => now(),
                    'description' => "Salary Payout: {$salary->month} for {$salary->staff->full_name}"
                ]);

                // 3. Record in BranchExpense
                if ($salary->staff && $salary->staff->branch_id) {
                    BranchExpense::create([
                        'branch_id' => $salary->staff->branch_id,
                        'transaction_id' => $transaction->id,
                        'type' => 'outflow',
                        'date' => now()->toDateString(),
                        'expense_type' => 'Salary Payment',
                        'medium' => $salary->payment_method ?: 'Cash',
                        'description' => "Salary Disbursement for {$salary->staff->full_name} ({$salary->month})",
                        'amount' => $salary->net_payable,
                    ]);
                }

                return response()->json([
                    'statusCode' => 2000,
                    'message' => 'Salary disbursed successfully',
                    'data' => $salary
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 5000,
                'message' => 'Failed to disburse salary: ' . $e->getMessage()
            ], 500);
        }
    }
}

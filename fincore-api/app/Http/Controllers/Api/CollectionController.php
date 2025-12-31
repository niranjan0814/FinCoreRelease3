<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\CustomerLoanPayment;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CollectionController extends Controller
{
    /**
     * Get due payments/collections for a specific branch and date
     */
    public function getDuePayments(Request $request)
    {
        try {
            $request->validate([
                'branch_id' => 'required|exists:branches,id',
                'CSU_id' => 'nullable|exists:centers,id',
                'date' => 'nullable|date',
            ]);

            $branchId = $request->branch_id;
            $csuId = $request->CSU_id;
            $date = $request->date ?? now()->format('Y-m-d');

            // Fetch active loans for the branch/center
            $loansQuery = Loan::with(['customer', 'group', 'center', 'latestPayment'])
                ->where('status', Loan::STATUS_ACTIVE)
                ->whereHas('center', function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });

            if ($csuId) {
                $loansQuery->where('CSU_id', $csuId);
            }

            $loans = $loansQuery->get();

            // Transform data for the frontend
            $scheduledPayments = $loans->map(function ($loan) use ($date) {
                $latestPayment = $loan->latestPayment;

                // Handle cases where rental is missing or zero
                $rental = $loan->rentel;
                if (!$rental || $rental <= 0) {
                    $principal = $loan->approved_amount;
                    $interestRate = $loan->interest_rate / 100;
                    $terms = $loan->terms;
                    if ($terms > 0) {
                        $rental = round(($principal + ($principal * $interestRate)) / $terms, 2);
                        // Update loan record so it's fixed permanently
                        $loan->update(['rentel' => $rental]);
                    }
                }

                $currentSuspense = (float) $loan->suspense_balance;

                if (!$latestPayment) {
                    $rentalDue = $rental;
                    $arrears = $this->calculateArrears($loan, null, $date);
                } else {
                    // Update latest payment if it has zero rental/due amounts
                    if ($latestPayment->rental_amount <= 0 && $rental > 0) {
                        $latestPayment->update([
                            'rental_amount' => $rental,
                            'total_due' => $rental,
                            'remained_due' => $rental
                        ]);
                    }
                    $rentalDue = $latestPayment->total_due > 0 ? $latestPayment->total_due : $rental;
                    $arrears = (float) $latestPayment->arrears;
                }

                // Calculate the final amount the officer needs to collect
                // Adjusted Due = (Standard Rental + Arrears) - Existing Suspense
                $rawDue = $rentalDue + $arrears;
                $adjustedDue = max(0, $rawDue - $currentSuspense);

                return [
                    'id' => (string) $loan->id,
                    'customer' => $loan->customer ? $loan->customer->full_name : 'Unknown',
                    'customerId' => $loan->customer ? $loan->customer->id : '',
                    'customerCode' => $loan->customer ? $loan->customer->customer_code : '',
                    'contractNo' => $loan->loan_id,
                    'dueAmount' => (float) $adjustedDue,
                    'standardRental' => (float) $rentalDue,
                    'arrears' => (float) $arrears,
                    'suspense_balance' => $currentSuspense,
                    'group' => $loan->group ? $loan->group->group_name : '-',
                    'center_name' => $loan->center ? $loan->center->center_name : '-',
                    'outstanding' => (float) $loan->outstanding_amount,
                    'rentel' => (float) ($loan->rentel ?? 0),
                    'address' => $loan->customer ? trim(($loan->customer->address_line_1 ?? '') . ' ' . ($loan->customer->address_line_2 ?? '')) : 'N/A',
                ];
            });

            // Calculate totals for stats
            $totalDue = $scheduledPayments->sum('dueAmount');
            $totalArrears = $scheduledPayments->sum('arrears');
            $totalSuspense = $loans->sum('suspense_balance');
            
            // Get today's collections
            $collectedTodayQuery = CustomerLoanPayment::whereDate('last_payment_date', $date)
                ->whereHas('loan', function ($q) use ($branchId, $csuId) {
                    $q->whereHas('center', function ($inner) use ($branchId) {
                        $inner->where('branch_id', $branchId);
                    });
                    if ($csuId) {
                        $q->where('CSU_id', $csuId);
                    }
                });
            
            $collectedTotal = (float) $collectedTodayQuery->sum('last_payment_amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'payments' => $scheduledPayments,
                    'stats' => [
                        'totalDue' => (float) $totalDue,
                        'collected' => $collectedTotal,
                        'arrears' => (float) $totalArrears,
                        'suspense' => (float) $totalSuspense,
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching due payments', [
                'branch_id' => $request->branch_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch collection data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Collect payment for a loan
     */
    public function collectPayment(Request $request)
    {
        $request->validate([
            'loan_id' => 'required|exists:loans,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'receipt_number' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $loan = Loan::with(['customer', 'latestPayment'])->findOrFail($request->loan_id);
                $paymentAmount = (float) $request->amount;
                $paymentDate = Carbon::parse($request->payment_date);

                // 1. Get current state
                $latestPayment = $loan->latestPayment;
                $previousCapital = $latestPayment ? $latestPayment->current_capital_balance : $loan->outstanding_amount;
                $previousInterest = $latestPayment ? $latestPayment->current_balance_interest : 0;
                $existingSuspense = (float) $loan->suspense_balance;

                // 2. Calculations
                $rental = $loan->rentel ?? 0;
                $arrears = $latestPayment ? (float) $latestPayment->arrears : $this->calculateArrears($loan, null, $paymentDate);
                $totalDueNow = $rental + $arrears;

                // Funds available = what user paid + what we had in advance
                $totalAvailable = $paymentAmount + $existingSuspense;

                // We apply funds up to the total due now. Any excess goes to suspense.
                $amountToApply = min($totalAvailable, $totalDueNow);
                
                // However, the user might want to pay MORE than the due to reduce capital faster?
                // If they pay more, we usually apply the "required" part to the schedule 
                // and the "excess" is held in suspense to offset future payments.
                // Alternatively, excess could go straight to capital. 
                // Given the user's specific request for "SUSPENSE", we will hold it in suspense.
                
                $suspenseGenerated = $paymentAmount > $totalDueNow ? ($paymentAmount - $totalDueNow) : 0;
                $suspenseUsed = min($existingSuspense, $totalDueNow);
                
                // Real payment split logic (based on amount to apply)
                $interestRate = $loan->interest_rate / 100;
                $interestDue = $previousCapital * $interestRate;
                
                $interestPayment = min($amountToApply, $interestDue);
                $capitalPayment = $amountToApply - $interestPayment;

                // 3. New Balances
                $newInterestBalance = max(0, $previousInterest + $interestDue - $interestPayment);
                $newCapitalBalance = max(0, $previousCapital - $capitalPayment);
                $newTotalBalance = $newInterestBalance + $newCapitalBalance;
                
                // Suspense update: current + new - used
                $newSuspenseBalance = $existingSuspense + $suspenseGenerated - $suspenseUsed;

                // 4. Create official receipt
                $receipt = Receipt::create([
                    'receipt_id' => 'RCT-' . date('Ymd') . '-' . str_pad(Receipt::count() + 1, 4, '0', STR_PAD_LEFT),
                    'staff_id' => auth()->id(),
                    'center_id' => $loan->CSU_id,
                    'group_id' => $loan->group_id,
                    'customer_id' => $loan->customer_id,
                    'loan_id' => $loan->id,
                    'current_due' => $totalDueNow,
                    'current_due_amount' => $paymentAmount,
                    'current_balance_amount' => $newTotalBalance,
                    'status' => 'active',
                ]);

                // 5. Create payment record
                $payment = CustomerLoanPayment::create([
                    'customer_id' => $loan->customer_id,
                    'loan_id' => $loan->id,
                    'receipt_id' => $receipt->id,
                    'last_payment_amount' => $paymentAmount,
                    'last_payment_date' => $paymentDate,
                    'full_balance' => $newTotalBalance,
                    'current_balance_amount' => $newTotalBalance,
                    'current_capital_balance' => $newCapitalBalance,
                    'current_balance_interest' => $newInterestBalance,
                    'interest_amount' => $interestPayment,
                    'rental_amount' => $rental,
                    'total_due' => $rental,
                    'remained_due' => max(0, $totalDueNow - $totalAvailable),
                    'arrears' => max(0, $totalDueNow - $totalAvailable),
                    'suspense_generated' => $suspenseGenerated,
                    'suspense_used' => $suspenseUsed,
                    'arrears_age' => $this->calculateArrearAge($loan, $paymentDate),
                ]);

                // 6. Update Loan record
                $loan->outstanding_amount = $newTotalBalance;
                $loan->suspense_balance = $newSuspenseBalance;
                
                if ($newTotalBalance <= 0) {
                    $loan->status = Loan::STATUS_COMPLETED;
                }
                
                $loan->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Payment collected successfully',
                    'data' => [
                        'payment' => $payment,
                        'receipt' => $receipt,
                        'loan' => $loan,
                    ]
                ], 200);
            });

        } catch (\Exception $e) {
            Log::error('Error collecting payment', [
                'loan_id' => $request->loan_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to collect payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate arrears based on missed payments
     */
    private function calculateArrears($loan, $latestPayment, $currentDate)
    {
        if (!$latestPayment || !$latestPayment->last_payment_date) {
            // Calculate from loan start date
            $startDate = Carbon::parse($loan->agreement_date);
        } else {
            $startDate = Carbon::parse($latestPayment->last_payment_date);
        }

        $today = Carbon::parse($currentDate);
        $daysDiff = $startDate->diffInDays($today);
        
        // Determine payment frequency
        $termType = $loan->product->term_type ?? 'Weekly';
        $intervalDays = $termType === 'Monthly' ? 30 : ($termType === 'Bi-Weekly' ? 14 : 7);
        
        $missedPayments = floor($daysDiff / $intervalDays);
        $rentel = $loan->rentel ?? 0;
        
        return max(0, $missedPayments * $rentel);
    }

    /**
     * Calculate arrear age in days
     */
    private function calculateArrearAge($loan, $currentDate)
    {
        $startDate = Carbon::parse($loan->agreement_date);
        $today = Carbon::parse($currentDate);
        
        return max(0, $startDate->diffInDays($today));
    }

    /**
     * Get collection history for a loan
     */
    public function getCollectionHistory(Request $request, $loanId)
    {
        try {
            $payments = CustomerLoanPayment::where('loan_id', $loanId)
                ->with(['receipt', 'customer'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $payments
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch collection history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export Collection Summary to CSV.
     */
    public function export(Request $request)
    {
        try {
            $request->validate([
                'branch_id' => 'required|exists:branches,id',
                'CSU_id' => 'nullable|exists:centers,id',
                'date' => 'nullable|date',
            ]);

            $branchId = $request->branch_id;
            $csuId = $request->CSU_id;
            $date = $request->date ?? now()->format('Y-m-d');

            $loansQuery = Loan::with(['customer', 'group', 'center', 'latestPayment'])
                ->where('status', Loan::STATUS_ACTIVE)
                ->whereHas('center', function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });

            if ($csuId) {
                $loansQuery->where('CSU_id', $csuId);
            }

            $loans = $loansQuery->get();

            $headers = [
                "Content-type" => "text/csv",
                "Content-Disposition" => "attachment; filename=collection_summary_" . $date . ".csv",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0"
            ];

            $columns = [
                'Contract No', 'Customer Name', 'Group', 'Center', 
                'Due Amount', 'Standard Rental', 'Arrears', 'Suspense Balance', 'Outstanding'
            ];

            $callback = function() use ($loans, $columns, $date) {
                $file = fopen('php://output', 'w');
                fputcsv($file, $columns);

                foreach ($loans as $loan) {
                    $latestPayment = $loan->latestPayment;
                    $rental = $loan->rentel ?? 0;
                    $arrears = $latestPayment ? (float) $latestPayment->arrears : $this->calculateArrears($loan, null, $date);
                    $currentSuspense = (float) $loan->suspense_balance;
                    $rentalDue = $latestPayment ? ($latestPayment->total_due > 0 ? $latestPayment->total_due : $rental) : $rental;
                    $rawDue = $rentalDue + $arrears;
                    $adjustedDue = max(0, $rawDue - $currentSuspense);

                    $row = [
                        $loan->loan_id,
                        $loan->customer ? $loan->customer->full_name : 'Unknown',
                        $loan->group ? $loan->group->group_name : '-',
                        $loan->center ? $loan->center->center_name : '-',
                        $adjustedDue,
                        $rentalDue,
                        $arrears,
                        $currentSuspense,
                        $loan->outstanding_amount
                    ];

                    fputcsv($file, $row);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export collection summary: ' . $e->getMessage()
            ], 500);
        }
    }
}

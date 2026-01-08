<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Models\SalaryPayment;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayrollController extends BaseController
{
    /**
     * Get payroll statistics.
     */
    public function getStats()
    {
        $currentMonth = now()->format('F Y');
        
        $payrollQuery = SalaryPayment::where('month', $currentMonth);
        
        $totalPayroll = (float)$payrollQuery->sum('net_payable');
        $processedCount = $payrollQuery->distinct('staff_id')->count('staff_id');

        $activeHeadcount = Staff::where('account_status', 'active')->count();
        
        $eligibleForPayroll = max(0, $activeHeadcount - $processedCount);

        return response()->json([
            'status' => 'success',
            'data' => [
                'totalPayroll' => $totalPayroll,
                'processedCount' => $processedCount,
                'averageSalary' => $processedCount > 0 ? (float)($totalPayroll / $processedCount) : 0,
                'activeHeadcount' => $activeHeadcount,
                'eligibleForPayroll' => $eligibleForPayroll,
            ]
        ]);
    }

    /**
     * Get payroll history.
     */
    public function getHistory(Request $request)
    {
        // Use user relationship and join with staff or use a more efficient way
        // Assuming we want names from Staff, we can load user then staff or just use user->name
        $query = SalaryPayment::with('staff:staff_id,full_name');

        if ($request->month) {
            $query->where('month', $request->month);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $history = $query->orderBy('payment_date', 'desc')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'employeeName' => $p->staff ? $p->staff->full_name : 'Unknown',
                'employeeId' => $p->staff_id,
                'month' => $p->month,
                'baseSalary' => (float)$p->base_salary,
                'allowances' => (float)$p->allowances,
                'deductions' => (float)$p->deductions,
                'netPayable' => (float)$p->net_payable,
                'paymentDate' => $p->payment_date ? $p->payment_date->toDateString() : null,
                'status' => $p->status,
                'paymentMethod' => $p->payment_method,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $history
        ]);
    }

    /**
     * Process batch or individual payroll.
     */
    public function processPayment(Request $request)
    {
        $request->validate([
            'month' => 'required|string',
            'baseSalary' => 'required|numeric',
            'allowances' => 'required|numeric',
            'deductions' => 'required|numeric',
            'paymentMethod' => 'required|string',
            'employeeIds' => 'required|array',
            'employeeIds.*' => 'required',
            'allowances_detail' => 'nullable|array',
            'deductions_detail' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $processedCount = 0;
            $skippedCount = 0;
            $netPayablePerHead = (float)$request->baseSalary + (float)$request->allowances - (float)$request->deductions;

            foreach ($request->employeeIds as $id) {
                // The frontend sends User IDs.
                $user = \App\Models\User::find($id);
                if (!$user) {
                    $skippedCount++;
                    continue;
                }

                $staffId = $user->user_name; // This maps to Staff.staff_id

                // Check if already paid for this month using user_id or staff_id
                $alreadyPaid = SalaryPayment::where('user_id', $user->id)
                    ->where('month', $request->month)
                    ->exists();

                if ($alreadyPaid) {
                    $skippedCount++;
                    continue;
                }

                SalaryPayment::create([
                    'user_id' => $user->id,
                    'staff_id' => $staffId, // If you decide to add this to migration
                    'month' => $request->month,
                    'base_salary' => $request->baseSalary,
                    'allowances' => $request->allowances,
                    'deductions' => $request->deductions,
                    'net_payable' => $netPayablePerHead,
                    'payment_date' => null,
                    'status' => 'Pending',
                    'payment_method' => $request->paymentMethod,
                    'allowances_detail' => $request->allowances_detail,
                    'deductions_detail' => $request->deductions_detail,
                    'notes' => $request->notes,
                    'processed_by' => auth()->id(),
                ]);
                $processedCount++;
            }

            DB::commit();

            $message = "Successfully processed payroll for $processedCount employees.";
            if ($skippedCount > 0) {
                $message .= " $skippedCount employees were skipped because they were already paid or not found.";
            }

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'processedCount' => $processedCount,
                'skippedCount' => $skippedCount
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payroll Processing Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process payroll: ' . $e->getMessage()
            ], 500);
        }
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Loan;
use Illuminate\Support\Facades\Log;

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
                'date' => 'nullable|date',
            ]);

            $branchId = $request->branch_id;
            $date = $request->date ?? now()->format('Y-m-d');

            // Fetch active loans for the branch
            // Assuming 'Active' is the status for ongoing loans
            // We join with Center to filter by Branch
            $loans = Loan::with(['customer', 'group', 'center'])
                ->where('status', Loan::STATUS_ACTIVE)
                ->whereHas('center', function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                })
                ->get();

            // Transform data for the frontend
            $scheduledPayments = $loans->map(function ($loan) {
                // Logic to calculate Due and Arrears
                // For MVP, using 'rentel' as Due Amount (Weekly/Monthly installment)
                // Arrears logic depends on payment history, setting to 0 or derive if field exists
                
                return [
                    'id' => (string) $loan->id,
                    'customer' => $loan->customer ? $loan->customer->full_name : 'Unknown',
                    'customerId' => $loan->customer ? $loan->customer->customer_id : '',
                    'contractNo' => $loan->loan_id, // Using loan_id as contract number
                    'dueAmount' => (float) $loan->rentel, // Assuming 'rentel' is the installment amount
                    'arrears' => 0, // Placeholder calculation
                    'group' => $loan->group ? $loan->group->group_name : '-',
                    'center_name' => $loan->center ? $loan->center->center_name : '-',
                ];
            });

            // Calculate totals for stats
            $totalDue = $scheduledPayments->sum('dueAmount');
            $totalArrears = $scheduledPayments->sum('arrears');
            
            return response()->json([
                'success' => true,
                'data' => [
                    'payments' => $scheduledPayments,
                    'stats' => [
                        'totalDue' => $totalDue,
                        'collected' => 0, // Needs payment transaction table query
                        'arrears' => $totalArrears,
                        'suspense' => 0
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching due payments', [
                'branch_id' => $request->branch_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch collection data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

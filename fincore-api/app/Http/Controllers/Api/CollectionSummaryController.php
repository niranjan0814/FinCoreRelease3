<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Loan;
use App\Models\CustomerLoanPayment;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CollectionSummaryController extends Controller
{
    public function getSummary(Request $request)
    {
        try {
            $request->validate([
                'date' => 'required|date',
                'view_type' => 'required|in:daily,weekly,monthly',
            ]);

            $date = Carbon::parse($request->date);
            $viewType = $request->view_type;

            // Determine Date Range
            if ($viewType === 'weekly') {
                $startDate = $date->copy()->startOfWeek();
                $endDate = $date->copy()->endOfWeek();
            } elseif ($viewType === 'monthly') {
                $startDate = $date->copy()->startOfMonth();
                $endDate = $date->copy()->endOfMonth();
            } else { // daily
                $startDate = $date->copy();
                $endDate = $date->copy();
            }

            $branches = Branch::all();
            $summaryData = [];

            foreach ($branches as $branch) {
                // 1. Get Active Loans for this Branch
                $loans = Loan::with(['latestPayment', 'product', 'extensions']) // Eager load extensions
                    ->where('status', Loan::STATUS_ACTIVE)
                    ->whereHas('center', function ($q) use ($branch) {
                        $q->where('branch_id', $branch->id);
                    })
                    ->get();

                $branchTarget = 0;
                $activeCustomers = $loans->count(); // Total active loans/customers in branch

                // 2. Calculate Target (Due) & Due Customers
                $dueCustomersCount = 0;
                
                foreach ($loans as $loan) {
                    $rental = $loan->rentel ?? 0;
                    $arrears = $loan->latestPayment ? (float) $loan->latestPayment->arrears : 0;
                    
                    // Logic to count how many times this loan is due in the range
                    $timesDue = $this->calculateTimesDue($loan, $startDate, $endDate);
                    
                    if ($timesDue > 0) {
                        $branchTarget += ($rental * $timesDue) + $arrears;
                        $dueCustomersCount++; // They are scheduled to pay
                    } elseif ($arrears > 0) {
                        $branchTarget += $arrears;
                        $dueCustomersCount++; // They are due because they owe money
                    }
                }

                // 3. Get Actual Collections in this period
                $paymentQuery = CustomerLoanPayment::whereBetween('last_payment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                    ->where('status', '!=', 'cancelled') // Exclude cancelled payments
                    ->whereHas('loan.center', function ($q) use ($branch) {
                        $q->where('branch_id', $branch->id);
                    });

                $collected = $paymentQuery->sum('last_payment_amount');
                $paidCustomersCount = $paymentQuery->distinct('loan_id')->count('loan_id');

                // 4. Calculate KPIs
                $pending = max(0, $branchTarget - $collected);
                $variance = $collected - $branchTarget;
                
                $achievement = $branchTarget > 0 ? ($collected / $branchTarget) * 100 : ($collected > 0 ? 100 : 0);

                $summaryData[] = [
                    'branch' => $branch->branch_name,
                    'branchId' => (string) $branch->id,
                    'target' => round($branchTarget, 2),
                    'collected' => round($collected, 2),
                    'variance' => round($variance, 2),
                    'total_active_customers' => $activeCustomers,
                    'due_customers' => $dueCustomersCount,
                    'paid_customers' => $paidCustomersCount,
                    'achievement' => round($achievement, 1),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $summaryData
            ]);

        } catch (\Exception $e) {
            Log::error('Collection Summary Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function calculateTimesDue($loan, $startDate, $endDate)
    {
        $termType = $loan->product->term_type ?? 'Weekly';
        $agreementDate = $loan->agreement_date 
            ? Carbon::parse($loan->agreement_date)->startOfDay() 
            : Carbon::parse($loan->created_at)->startOfDay();
            
        $extensions = $loan->extensions ?? collect([]);

        $timesDue = 0;
        $current = $startDate->copy()->startOfDay();

        while ($current->lte($endDate)) {
            $isNaturallyDue = false;
            
            if ($termType === 'Monthly') {
                $isNaturallyDue = $agreementDate->day === $current->day;
            } elseif ($termType === 'Bi-Weekly') {
                $daysDiff = $agreementDate->diffInDays($current);
                $isNaturallyDue = ($daysDiff % 14 === 0) && $current->gte($agreementDate);
            } else { // Weekly
                $isNaturallyDue = ($agreementDate->dayOfWeek === $current->dayOfWeek) && $current->gte($agreementDate);
            }

            // Check extensions
            $currentDateStr = $current->format('Y-m-d');
            
            // Was it MOVED TO today?
            $movedToHere = $extensions->contains(function($ext) use ($currentDateStr) {
                return $ext->new_due_date->format('Y-m-d') === $currentDateStr;
            });
            
            // Was it MOVED AWAY from today?
            $movedAway = $extensions->contains(function($ext) use ($currentDateStr) {
                return $ext->original_due_date->format('Y-m-d') === $currentDateStr;
            });
            
            // Final decision
            $isDue = ($isNaturallyDue || $movedToHere) && !$movedAway;
            
            if ($isDue) {
                $timesDue++;
            }
            $current->addDay();
        }

        return $timesDue;
    }

    public function export(Request $request)
    {
        // Reuse getSummary logic but format as CSV
        // For brevity, calling getSummary internally or duplicating logic
        // This is a placeholder for the export functionality structure
        
        $dataResponse = $this->getSummary($request);
        $data = $dataResponse->getData()->data ?? [];

        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=collection_summary.csv",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $columns = ['Branch', 'Target', 'Collected', 'Pending', 'Customers', 'Achievement (%)'];

        $callback = function() use ($data, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($data as $row) {
                fputcsv($file, [
                    $row->branch,
                    $row->target,
                    $row->collected,
                    $row->pending,
                    $row->customers,
                    $row->achievement
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

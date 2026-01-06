<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\CustomerLoanPayment;
use App\Models\LoanDueDateExtension;
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
            $loansQuery = Loan::with(['customer', 'group', 'center', 'latestPayment', 'product', 'extensions'])
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
                $extensions = $loan->extensions;

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

                // Filter Logic:
                // Include if:
                // 1. Customer has arrears (Must pay regardless of schedule)
                // 2. OR Today is their scheduled payment date (Weekly/Bi-Weekly/Monthly) AND not moved away
                // 3. OR Payment was moved TO today (via extension)
                
                $shouldInclude = false;

                // Check 1: Arrears
                if ($arrears > 0) {
                    $shouldInclude = true;
                } 

                $termType = $loan->product->term_type ?? 'Weekly';
                // Fallback to created_at if agreement_date is missing
                $agreementDate = $loan->agreement_date 
                    ? Carbon::parse($loan->agreement_date) 
                    : Carbon::parse($loan->created_at);
                    
                $selectedDate = Carbon::parse($date);
                
                // Check 2: Standard Schedule (Naturally Due)
                $isNaturallyDue = false;
                if ($selectedDate->gte($agreementDate)) {
                    if ($termType === 'Monthly') {
                        // Match day of month (e.g., 5th == 5th)
                        if ($agreementDate->day === $selectedDate->day) {
                            $isNaturallyDue = true;
                        }
                    } elseif ($termType === 'Bi-Weekly') {
                        // Match every 14 days
                        $daysDiff = $agreementDate->diffInDays($selectedDate);
                        if ($daysDiff % 14 === 0) {
                            $isNaturallyDue = true;
                        }
                    } else {
                        // Weekly: Match day of week (e.g., Monday == Monday)
                        if ($agreementDate->dayOfWeek === $selectedDate->dayOfWeek) {
                            $isNaturallyDue = true;
                        }
                    }
                }

                // Check 3: Extensions logic
                $selectedDateStr = $selectedDate->format('Y-m-d');
                
                // Was it MOVED TO today?
                $movedToHere = $extensions->contains(function($ext) use ($selectedDateStr) {
                    return $ext->new_due_date->format('Y-m-d') === $selectedDateStr;
                });

                // Was it MOVED AWAY from today?
                $movedAway = $extensions->contains(function($ext) use ($selectedDateStr) {
                    return $ext->original_due_date->format('Y-m-d') === $selectedDateStr;
                });

                $isPotentiallyDue = $isNaturallyDue || $movedToHere;

                if ($isPotentiallyDue && !$movedAway) {
                    $shouldInclude = true;
                }
                
                // Final check: if strictly excluded (moved away and no arrears) or simply not included yet
                if (!$shouldInclude) {
                    return null;
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
            })->filter()->values();

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
     * Extend or move a due date for a loan
     */
    public function extendDueDate(Request $request, $id)
    {
        try {
            $request->validate([
                'original_due_date' => 'required|date',
                'new_due_date' => 'required|date|after:original_due_date',
                'reason' => 'required|string|max:500',
            ]);

            $loan = Loan::findOrFail($id);

            // Create extension record
            $extension = LoanDueDateExtension::create([
                'loan_id' => $loan->id,
                'original_due_date' => $request->original_due_date,
                'new_due_date' => $request->new_due_date,
                'reason' => $request->reason,
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Due date extended successfully',
                'data' => $extension
            ]);

        } catch (\Exception $e) {
            Log::error('Error extending due date', [
                'loan_id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to extend due date',
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

    /**
     * Get due list for a specific date and optional center
     * Used by the Due List page to show scheduled payments
     */
    public function getDueList(Request $request)
    {
        try {
            $request->validate([
                'date' => 'nullable|date',
                'center_id' => 'nullable|exists:centers,id',
                'branch_id' => 'nullable|exists:branches,id',
                'show_all' => 'nullable|boolean',
            ]);

            $date = $request->date ?? now()->format('Y-m-d'); // Default to today if not provided
            $centerId = $request->center_id;
            $branchId = $request->branch_id;
            $showAll = $request->boolean('show_all');

            // Base query for active loans
            $loansQuery = Loan::with(['customer', 'center', 'latestPayment', 'product', 'extensions'])
                ->where('status', Loan::STATUS_ACTIVE);

            // Filter by branch if provided
            if ($branchId) {
                $loansQuery->whereHas('center', function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
            }

            // Filter by center if provided (overrides branch filter for specificity, effectively)
            if ($centerId) {
                $loansQuery->where('CSU_id', $centerId);
            }

            // Role-based filtering removed to match Collection Screen behavior
            // if ($user && $user->hasRole('field_officer')) { ... }

            $loans = $loansQuery->get();

            // Transform data for frontend
            $duePayments = $loans->map(function ($loan) use ($date, $showAll) {
                $latestPayment = $loan->latestPayment;
                $rental = $loan->rentel ?? 0;
                $extensions = $loan->extensions;

                // Determine schedule details
                $termType = optional($loan->product)->term_type ?? 'Weekly';
                $agreementDate = $loan->agreement_date 
                    ? \Carbon\Carbon::parse($loan->agreement_date)->startOfDay() 
                    : \Carbon\Carbon::parse($loan->created_at)->startOfDay();
                $selectedDate = \Carbon\Carbon::parse($date)->startOfDay();
                
                // Calculate Next Due Date (if showing all) or check specific date
                $itemDueDate = $date;
                $isDue = false;

                if ($showAll) {
                    // Find the next occurrence of the due date on or after today
                    $today = \Carbon\Carbon::now()->startOfDay();
                    
                    // 1. Calculate Standard Next Due Date
                    $standardNextDue = null;
                    if ($termType === 'Monthly') {
                        $nextDue = $today->copy();
                        if ($today->day > $agreementDate->day) {
                            $nextDue->addMonth();
                        }
                        $nextDue->day = min($agreementDate->day, $nextDue->daysInMonth);
                        $standardNextDue = $nextDue;
                    } elseif ($termType === 'Bi-Weekly') {
                        $daysSinceAgreement = $agreementDate->diffInDays($today);
                        $cycles = ceil($daysSinceAgreement / 14);
                        if ($today->lt($agreementDate)) { 
                             $cycles = 0; 
                        }
                        $standardNextDue = $agreementDate->copy()->addDays($cycles * 14);
                    } else {
                        // Weekly
                        $dayOfWeek = $agreementDate->dayOfWeek;
                        $nextDue = $today->copy();
                        if ($today->dayOfWeek !== $dayOfWeek) {
                            $nextDue->next($dayOfWeek);
                        }
                        $standardNextDue = $nextDue;
                    }
                    
                    // 2. Follow extension chain from this date
                    $currentDate = $standardNextDue;
                    $loops = 0;
                    $chainFound = true;
                    // Prevent infinite loops just in case
                    while ($chainFound && $loops < 10) {
                        $ext = $extensions->first(function ($e) use ($currentDate) {
                             return $e->original_due_date->format('Y-m-d') === $currentDate->format('Y-m-d');
                        });
                        
                        if ($ext) {
                            $currentDate = $ext->new_due_date;
                            $loops++;
                        } else {
                            $chainFound = false;
                        }
                    }
                    
                    $itemDueDate = $currentDate->format('Y-m-d');
                    $isDue = true; 

                } else {
                    // Strictly check if due on selected date
                    $selectedDateStr = $selectedDate->format('Y-m-d');
                    
                    // 1. Is it NATURALLY due today?
                    $isNaturallyDue = false;
                    if ($selectedDate->gte($agreementDate)) {
                        if ($termType === 'Monthly') {
                            $isNaturallyDue = $agreementDate->day === $selectedDate->day;
                        } elseif ($termType === 'Bi-Weekly') {
                            $daysDiff = $agreementDate->diffInDays($selectedDate);
                            $isNaturallyDue = $daysDiff % 14 === 0;
                        } else {
                            $isNaturallyDue = $agreementDate->dayOfWeek === $selectedDate->dayOfWeek;
                        }
                    }

                    // 2. Was it MOVED TO today?
                    $movedToHere = $extensions->contains(function($ext) use ($selectedDateStr) {
                        return $ext->new_due_date->format('Y-m-d') === $selectedDateStr;
                    });
                    
                    // 3. Was it MOVED AWAY from today?
                    $movedAway = $extensions->contains(function($ext) use ($selectedDateStr) {
                        return $ext->original_due_date->format('Y-m-d') === $selectedDateStr;
                    });

                    // Logic: Must be (Naturally Due OR Moved To Here) AND (Not Moved Away)
                    $isPotentiallyDue = $isNaturallyDue || $movedToHere;
                    
                    if ($isPotentiallyDue && !$movedAway) {
                        $isDue = true;
                    } else {
                        $isDue = false;
                    }
                }

                // Check for arrears
                $arrears = $latestPayment ? (float) $latestPayment->arrears : 0;
                $hasArrears = $arrears > 0;

                // Include if:
                // 1. "Show All" is enabled
                // 2. OR Due on selected date (calculated above)
                // 3. OR Has arrears
                if (!$showAll && !$isDue && !$hasArrears) {
                    return null;
                }

                // Determine status
                $status = 'Pending';
                if ($hasArrears) {
                    $status = 'Overdue';
                }
                
                // If it was moved, maybe show status "Rescheduled"?
                // For now, keep simpler.

                // Calculate due amount
                $dueAmount = $rental + $arrears;

                return [
                    'id' => (string) $loan->id,
                    'customer' => $loan->customer ? $loan->customer->full_name : 'Unknown',
                    'customerId' => $loan->customer ? $loan->customer->customer_code : '',
                    'contractNo' => $loan->loan_id,
                    'dueAmount' => (float) $dueAmount,
                    'center' => $loan->center ? $loan->center->center_name : '-',
                    'centerId' => (string) ($loan->CSU_id ?? ''),
                    'dueDate' => $itemDueDate,
                    'status' => $status,
                ];
            })->filter()->values();

            // Sort by due date if "Show All" is on
            if ($showAll) {
                $duePayments = $duePayments->sortBy('dueDate')->values();
            }

            return response()->json([
                'success' => true,
                'data' => $duePayments,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching due list', [
                'date' => $request->date,
                'center_id' => $request->center_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch due list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get due list summary statistics
     * Returns aggregated due amounts for today and specific days of the month
     */
    public function getDueListSummary(Request $request)
    {
        try {
            $today = now()->format('Y-m-d');
            $year = now()->year;
            $month = now()->month;

            // Role-based filtering for field officers
            $user = auth()->user();
            $centerFilter = null;
            if ($user && $user->hasRole('field_officer')) {
                $centerFilter = $user->staff->center_id ?? null;
            }

            // Base query function
            $getLoansForDate = function ($date) use ($centerFilter) {
                $query = Loan::with(['latestPayment', 'product'])
                    ->where('status', Loan::STATUS_ACTIVE);

                if ($centerFilter) {
                    $query->where('CSU_id', $centerFilter);
                }

                return $query->get()->filter(function ($loan) use ($date) {
                    $termType = $loan->product->term_type ?? 'Weekly';
                    $agreementDate = $loan->agreement_date 
                        ? \Carbon\Carbon::parse($loan->agreement_date) 
                        : \Carbon\Carbon::parse($loan->created_at);
                    $selectedDate = \Carbon\Carbon::parse($date);

                    if (!$selectedDate->gte($agreementDate)) {
                        return false;
                    }

                    // Check arrears
                    $hasArrears = ($loan->latestPayment && $loan->latestPayment->arrears > 0);

                    if ($termType === 'Monthly') {
                        return $agreementDate->day === $selectedDate->day || $hasArrears;
                    } elseif ($termType === 'Bi-Weekly') {
                        $daysDiff = $agreementDate->diffInDays($selectedDate);
                        return $daysDiff % 14 === 0 || $hasArrears;
                    } else {
                        return $agreementDate->dayOfWeek === $selectedDate->dayOfWeek || $hasArrears;
                    }
                });
            };

            // Calculate due amounts for different dates
            $calculateDue = function ($loans) {
                return $loans->sum(function ($loan) {
                    $rental = $loan->rentel ?? 0;
                    $arrears = $loan->latestPayment ? (float) $loan->latestPayment->arrears : 0;
                    return $rental + $arrears;
                });
            };

            // Today's due
            $todayLoans = $getLoansForDate($today);
            $todayDue = $calculateDue($todayLoans);
            $todayCount = $todayLoans->count();

            // 1st of current month
            $firstOfMonth = \Carbon\Carbon::create($year, $month, 1)->format('Y-m-d');
            $firstLoans = $getLoansForDate($firstOfMonth);
            $firstDue = $calculateDue($firstLoans);
            $firstCount = $firstLoans->count();

            // 8th of current month
            $eighthOfMonth = \Carbon\Carbon::create($year, $month, 8)->format('Y-m-d');
            $eighthLoans = $getLoansForDate($eighthOfMonth);
            $eighthDue = $calculateDue($eighthLoans);
            $eighthCount = $eighthLoans->count();

            // 15th of current month
            $fifteenthOfMonth = \Carbon\Carbon::create($year, $month, 15)->format('Y-m-d');
            $fifteenthLoans = $getLoansForDate($fifteenthOfMonth);
            $fifteenthDue = $calculateDue($fifteenthLoans);
            $fifteenthCount = $fifteenthLoans->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'todayDue' => (float) $todayDue,
                    'todayPaymentsCount' => $todayCount,
                    'firstOfMonthDue' => (float) $firstDue,
                    'firstOfMonthCount' => $firstCount,
                    'eighthOfMonthDue' => (float) $eighthDue,
                    'eighthOfMonthCount' => $eighthCount,
                    'fifteenthOfMonthDue' => (float) $fifteenthDue,
                    'fifteenthOfMonthCount' => $fifteenthCount,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching due list summary', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch due list summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export due list to CSV
     */
    public function exportDueList(Request $request)
    {
        try {
            $request->validate([
                'date' => 'required|date',
                'center_id' => 'nullable|exists:centers,id',
            ]);

            $date = $request->date;
            $centerId = $request->center_id;

            // Fetch due list data using the same logic
            $loansQuery = Loan::with(['customer', 'center', 'latestPayment'])
                ->where('status', Loan::STATUS_ACTIVE);

            if ($centerId) {
                $loansQuery->where('CSU_id', $centerId);
            }

            $user = auth()->user();
            if ($user && $user->hasRole('field_officer')) {
                $staffCenterId = $user->staff->center_id ?? null;
                if ($staffCenterId) {
                    $loansQuery->where('CSU_id', $staffCenterId);
                }
            }

            $loans = $loansQuery->get();

            $headers = [
                "Content-type" => "text/csv",
                "Content-Disposition" => "attachment; filename=due_list_" . $date . ".csv",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0"
            ];

            $columns = ['Customer ID', 'Customer Name', 'Contract No', 'Center', 'Due Amount', 'Due Date', 'Status'];

            $callback = function() use ($loans, $columns, $date) {
                $file = fopen('php://output', 'w');
                fputcsv($file, $columns);

                foreach ($loans as $loan) {
                    $latestPayment = $loan->latestPayment;
                    $rental = $loan->rentel ?? 0;
                    $arrears = $latestPayment ? (float) $latestPayment->arrears : 0;
                    $dueAmount = $rental + $arrears;
                    $status = $arrears > 0 ? 'Overdue' : 'Pending';

                    $row = [
                        $loan->customer ? $loan->customer->customer_code : '',
                        $loan->customer ? $loan->customer->full_name : 'Unknown',
                        $loan->loan_id,
                        $loan->center ? $loan->center->center_name : '-',
                        $dueAmount,
                        $date,
                        $status,
                    ];

                    fputcsv($file, $row);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export due list: ' . $e->getMessage()
            ], 500);
        }
    }
}

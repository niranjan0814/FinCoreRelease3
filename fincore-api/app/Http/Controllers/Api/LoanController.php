<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Loan::with(['customer', 'product', 'center.branch.manager', 'group', 'staff']);

            if ($request->has('status')) {
                if ($request->status === 'all_statuses') {
                    // Do nothing, show everything
                } elseif ($request->status !== 'All') {
                    $query->where('status', $request->status);
                } else {
                    $query->whereIn('status', [Loan::STATUS_ACTIVE, Loan::STATUS_APPROVED]);
                }
            } else {
                // Default view should only show approved/active loans
                $query->whereIn('status', [Loan::STATUS_ACTIVE, Loan::STATUS_APPROVED]);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('loan_id', 'LIKE', "%{$search}%")
                      ->orWhereHas('customer', function($cq) use ($search) {
                          $cq->where('full_name', 'LIKE', "%{$search}%")
                             ->orWhere('customer_code', 'LIKE', "%{$search}%");
                      });
                });
            }

            $loans = $query->paginate($request->input('per_page', 10));

            return response()->json([
                'status' => 'success',
                'data' => $loans->items(),
                'meta' => [
                    'current_page' => $loans->currentPage(),
                    'last_page' => $loans->lastPage(),
                    'total' => $loans->total(),
                    'per_page' => $loans->perPage(),
                    'stats' => [
                        'total_count' => Loan::whereIn('status', [Loan::STATUS_ACTIVE, Loan::STATUS_APPROVED])->count(),
                        'active_count' => Loan::whereIn('status', [Loan::STATUS_ACTIVE, Loan::STATUS_APPROVED])->count(),
                        'total_disbursed' => Loan::whereIn('status', [Loan::STATUS_ACTIVE, Loan::STATUS_APPROVED])->sum('approved_amount'),
                        'total_outstanding' => Loan::whereIn('status', [Loan::STATUS_ACTIVE, Loan::STATUS_APPROVED])->sum('outstanding_amount'),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch loans',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $loan = Loan::with(['customer', 'product', 'center', 'group', 'staff'])->findOrFail($id);
            return response()->json([
                'status' => 'success',
                'data' => $loan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Loan not found'
            ], 404);
        }
    }

    public function store(Request $request)
    {
        // Validation handles its own 422 response automatically
        $validated = $request->validate([
            'product_id' => 'required|exists:loan_products,id',
            'CSU_id' => 'required|exists:centers,id',
            'customer_id' => 'required|exists:customers,id',
            'group_id' => 'nullable|exists:groups,id',
            'request_amount' => 'required|numeric',
            'approved_amount' => 'required|numeric',
            'terms' => 'required|integer',
            'interest_rate' => 'required|numeric',
            'loan_step' => 'nullable|string',
            'service_charge' => 'nullable|numeric',
            'document_charge' => 'nullable|numeric',
            'guardian_nic' => 'required|string',
            'guardian_name' => 'required|string',
            'guardian_address' => 'required|string',
            'guardian_phone' => 'required|string',
            'guarantor1_name' => 'required|string',
            'guarantor1_nic' => 'required|string',
            'guarantor2_name' => 'nullable|string',
            'guarantor2_nic' => 'nullable|string',
            'witness1_id' => 'required|exists:staffs,staff_id|different:witness2_id',
            'witness2_id' => 'required|exists:staffs,staff_id|different:witness1_id',
        ]);

        // Check for existing active or pending loan of the same type for this customer
        $existingLoanQuery = \App\Models\Loan::where('customer_id', $validated['customer_id'])
            ->where('product_id', $validated['product_id'])
            ->whereNotIn('status', Loan::CLOSED_STATUSES);

        // If editing/resubmitting, exclude the current loan from the check
        if ($request->has('edit_id')) {
            $existingLoanQuery->where('id', '!=', $request->edit_id);
        }

        $existingLoan = $existingLoanQuery->first();

        if ($existingLoan) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer already has an active or pending loan of this type.',
                'errors' => [
                    'product_id' => ['Customer already has an ongoing loan of this type (' . $existingLoan->loan_id . ').']
                ]
            ], 422);
        }

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $validated) {
                // If we are editing an existing sent-back loan
                $loan = null;
                if ($request->has('edit_id')) {
                    $loan = Loan::find($request->edit_id);
                }

                if (!$loan) {
                    $loan = new Loan();
                    // Generate a new unique loan ID only for new loans
                    $loan->loan_id = 'LN-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
                    $loan->staff_id = auth()->id() ?? 1;
                }
                
                $loan->fill($validated);
                
                // Map guarantor and witness structured fields
                $loan->g1_details = [
                    'name' => $request->guarantor1_name,
                    'nic' => $request->guarantor1_nic
                ];
                $loan->g2_details = [
                    'name' => $request->guarantor2_name,
                    'nic' => $request->guarantor2_nic
                ];
                
                if ($request->witness1_id) {
                    $staff1 = \App\Models\Staff::find($request->witness1_id);
                    $loan->w1_details = [
                        'staff_id' => $request->witness1_id,
                        'name' => $staff1 ? $staff1->full_name : 'N/A'
                    ];
                }
                
                if ($request->witness2_id) {
                    $staff2 = \App\Models\Staff::find($request->witness2_id);
                    $loan->w2_details = [
                        'staff_id' => $request->witness2_id,
                        'name' => $staff2 ? $staff2->full_name : 'N/A'
                    ];
                }

                $loan->status = Loan::STATUS_PENDING_1ST;
                $loan->approval_level = 0;
                $loan->rejection_reason = null; // Clear reason on resubmission
                $loan->outstanding_amount = $validated['approved_amount'];
                $loan->save();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Loan application submitted successfully',
                    'data' => $loan
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to submit loan application: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function approve(Request $request, $id)
    {
        try {
            $loan = Loan::with(['customer', 'product', 'center.branch.manager', 'group', 'staff'])->findOrFail($id);
            $action = $request->input('action'); // 'approve' or 'send_back'
            
            if ($action === 'approve') {
                $history = is_array($loan->approve_history) ? $loan->approve_history : [];
                $approver = [
                    'id' => auth()->id(),
                    'name' => auth()->user()->user_name,
                    'at' => now()->toDateTimeString()
                ];

                if ($loan->approval_level === 0) {
                    // First level approval
                    $history['first'] = $approver;
                    
                    // Logic: If loan amount > 200,000, need 2nd approval
                    if ($loan->approved_amount >= 200000) {
                        $loan->status = Loan::STATUS_PENDING_2ND;
                        $loan->approval_level = 1;
                    } else {
                        $loan->status = Loan::STATUS_ACTIVE;
                        $loan->approval_level = 2;
                        
                        // Ensure rental is calculated before creating record
                        if (!$loan->rentel || $loan->rentel <= 0) {
                            $loan->rentel = $this->calculateRental($loan);
                            $loan->save();
                        }
                        
                        $this->createInitialPaymentRecord($loan);
                    }
                } elseif ($loan->approval_level === 1) {
                    // Second level approval
                    $history['second'] = $approver;
                    $loan->status = Loan::STATUS_ACTIVE;
                    $loan->approval_level = 2;
                    
                    // Ensure rental is calculated before creating record
                    if (!$loan->rentel || $loan->rentel <= 0) {
                        $loan->rentel = $this->calculateRental($loan);
                        $loan->save();
                    }
                    
                    $this->createInitialPaymentRecord($loan);
                }
                $loan->approve_history = $history;
            } else {
                $loan->status = Loan::STATUS_SENT_BACK;
                $loan->rejection_reason = $request->input('reason');
                $loan->approval_level = 0; // Reset to 0 for resubmission cycle
            }
            
            $loan->save();
            
            // Reload with relations for the response
            $loan->load(['customer', 'product', 'center.branch.manager', 'group', 'staff']);

            return response()->json([
                'status' => 'success',
                'message' => 'Loan status updated successfully',
                'data' => $loan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process loan approval',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $loan = Loan::findOrFail($id);

            // Prevent editing if loan is active (approved)
            if ($loan->status === Loan::STATUS_APPROVED || $loan->status === Loan::STATUS_ACTIVE) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot edit an active or approved loan.'
                ], 403);
            }

            // Reuse the same validation as store, but maybe some fields are not editable?
            // For simplicity, we can reuse similar validation or assume request is partial.
            // Typically, re-validation is good.
            $validated = $request->validate([
                'product_id' => 'sometimes|exists:loan_products,id',
                'CSU_id' => 'sometimes|exists:centers,id',
                'customer_id' => 'sometimes|exists:customers,id',
                'group_id' => 'nullable|exists:groups,id',
                'request_amount' => 'sometimes|numeric',
                'approved_amount' => 'sometimes|numeric',
                'terms' => 'sometimes|integer',
                'interest_rate' => 'sometimes|numeric',
                // Add other fields as 'sometimes'
            ]);

            $loan->update($request->all());

            return response()->json([
                'status' => 'success',
                'message' => 'Loan updated successfully',
                'data' => $loan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update loan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $loan = Loan::findOrFail($id);

            // Prevent deletion if loan is active (approved)
            if ($loan->status === Loan::STATUS_APPROVED || $loan->status === Loan::STATUS_ACTIVE) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot delete an active or approved loan.'
                ], 403);
            }

            $loan->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Loan deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete loan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Create the initial opening balance record in customer_loan_payment table
     */
    private function createInitialPaymentRecord($loan)
    {
        \App\Models\CustomerLoanPayment::create([
            'customer_id' => $loan->customer_id,
            'loan_id' => $loan->id,
            'receipt_id' => null,
            'last_payment_amount' => 0,
            'last_payment_date' => now(),
            'full_balance' => $loan->approved_amount,
            'current_balance_amount' => $loan->approved_amount,
            'current_capital_balance' => $loan->approved_amount,
            'current_balance_interest' => 0,
            'interest_amount' => 0,
            'rental_amount' => $loan->rentel,
            'total_due' => $loan->rentel,
            'remained_due' => $loan->rentel,
            'arrears' => 0,
            'arrears_age' => 0,
        ]);
    }

    /**
     * Helper to calculate the rental amount for a loan
     */
    private function calculateRental($loan)
    {
        $principal = $loan->approved_amount;
        $interestRate = $loan->interest_rate / 100;
        $terms = $loan->terms;

        if ($terms <= 0) return 0;

        // Formula: (Principal + Total Interest) / Number of Terms
        $totalInterest = $principal * $interestRate;
        return round(($principal + $totalInterest) / $terms, 2);
    }
}

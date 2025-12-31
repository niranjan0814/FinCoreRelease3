<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReceiptController extends Controller
{
    /**
     * Store a new receipt
     */
    public function store(Request $request)
    {
        $request->validate([
            'receipt_id' => 'required|unique:receipts',
            'loan_id' => 'required|exists:loans,id',
            'center_id' => 'required|exists:centers,id',
            'customer_id' => 'required|exists:customers,id',
            'current_due_amount' => 'required|numeric',
        ]);

        try {
            DB::beginTransaction();

            $receipt = Receipt::create([
                'receipt_id' => $request->receipt_id,
                'staff_id' => auth()->id(),
                'loan_id' => $request->loan_id,
                'center_id' => $request->center_id,
                'group_id' => $request->group_id,
                'customer_id' => $request->customer_id,
                'current_due_amount' => $request->current_due_amount,
                'current_due' => $request->current_due ?? 0,
                'current_balance_amount' => $request->current_balance_amount ?? 0,
                'digital_sign' => $request->digital_sign,
                'status' => 'active',
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Receipt created successfully',
                'data' => $receipt
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create receipt',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Request cancellation of a receipt
     */
    public function requestCancellation(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $receipt = Receipt::findOrFail($id);

            if ($receipt->status !== 'active') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Receipt is not active'
                ], 400);
            }

            // Only the creator or admin can request cancellation? 
            // Assuming creator:
            if ($receipt->staff_id !== auth()->id() && !auth()->user()->hasRole('admin') && !auth()->user()->hasRole('manager')) {
                 return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
            }

            $receipt->update([
                'status' => 'cancellation_pending',
                'cancellation_reason' => $request->reason,
                'cancellation_requested_by' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Cancellation requested successfully. Waiting for manager approval.',
                'data' => $receipt
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to request cancellation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get receipt details (for printing)
     */
    public function show($id)
    {
        try {
            $receipt = Receipt::with([
                'staff', 
                'customer', 
                'loan.product',
                'center.branch', 
                'group'
            ])->findOrFail($id);
            
            // Increment copy count if viewed for printing
            $receipt->increment('copy_count');

            return response()->json([
                'status' => 'success',
                'data' => $receipt
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Receipt not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Approve cancellation (Manager/Admin only)
     */
    public function approveCancellation(Request $request, $id)
    {
        // Permission check
        if (!auth()->user()->hasPermissionTo('receipts.approvecancel') && !auth()->user()->hasRole('manager') && !auth()->user()->hasRole('admin')) {
             return response()->json(['status' => 'error', 'message' => 'Permission denied'], 403);
        }

        try {
            return DB::transaction(function () use ($id) {
                $receipt = Receipt::findOrFail($id);

                if ($receipt->status !== 'cancellation_pending') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Receipt is not pending cancellation'
                    ], 400);
                }

                $receipt->update([
                    'status' => 'cancelled',
                    'cancellation_approved_by' => auth()->id(),
                    'cancellation_approved_at' => now(),
                ]);

                // 1. Find the payment associated with this receipt
                $payment = \App\Models\CustomerLoanPayment::where('receipt_id', $receipt->id)->first();
                if ($payment) {
                    $loan = \App\Models\Loan::findOrFail($payment->loan_id);

                    // 2. Reverse effects on loan
                    // Logic: Basically we want to restore balances to what they were before THIS payment.
                    // Instead of complex math, we can try to find the payment BEFORE this one.
                    $previousPayment = \App\Models\CustomerLoanPayment::where('loan_id', $loan->id)
                        ->where('id', '<', $payment->id)
                        ->where('status', '!=', 'cancelled')
                        ->latest()
                        ->first();

                    if ($previousPayment) {
                        $loan->outstanding_amount = $previousPayment->current_balance_amount;
                        // We might not have previous suspense stored explicitly in the payment record yet, 
                        // but let's assume we need to subtract the suspense that THIS payment generated 
                        // and add back the suspense that THIS payment used.
                        $loan->suspense_balance = max(0, $loan->suspense_balance - $payment->suspense_generated + $payment->suspense_used);
                    } else {
                        // This was the first payment
                        $loan->outstanding_amount = $loan->approved_amount; // or whatever the initial was
                        $loan->suspense_balance = 0;
                    }

                    // Reset loan status if it was completed
                    if ($loan->status === \App\Models\Loan::STATUS_COMPLETED) {
                        $loan->status = \App\Models\Loan::STATUS_ACTIVE;
                    }

                    $loan->save();

                    // 3. Mark the payment record as cancelled
                    $payment->update(['status' => 'cancelled']);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Receipt cancellation approved. Balances have been reversed.',
                    'data' => $receipt
                ]);
            });

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to approve cancellation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject cancellation (Manager/Admin only)
     */
    public function rejectCancellation(Request $request, $id)
    {
        if (!auth()->user()->hasPermissionTo('receipts.approvecancel') && !auth()->user()->hasRole('manager') && !auth()->user()->hasRole('admin')) {
             return response()->json(['status' => 'error', 'message' => 'Permission denied'], 403);
        }

        try {
            $receipt = Receipt::findOrFail($id);

            if ($receipt->status !== 'cancellation_pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Receipt is not pending cancellation'
                ], 400);
            }

            $receipt->update([
                'status' => 'active', // Back to active
                'cancellation_reason' => null,
                'cancellation_requested_by' => null,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Cancellation request rejected. Receipt remains active.',
                'data' => $receipt
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to reject cancellation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all pending cancellation requests
     */
    public function pendingCancellations(Request $request)
    {
        // Permission check: receipts.approvecancel is used consistently for approvals
        if (!auth()->user()->hasPermissionTo('receipts.approvecancel') && !auth()->user()->hasRole('manager') && !auth()->user()->hasRole('admin')) {
             return response()->json(['status' => 'error', 'message' => 'Permission denied'], 403);
        }

        try {
            $receipts = Receipt::with(['staff', 'customer', 'loan.product', 'center.branch'])
                ->where('status', 'cancellation_pending')
                ->latest()
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $receipts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch pending cancellations',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

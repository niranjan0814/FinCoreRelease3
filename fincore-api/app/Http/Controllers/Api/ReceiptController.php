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
        if (!auth()->user()->hasPermissionTo('receipts.approve_cancel') && !auth()->user()->hasRole('manager') && !auth()->user()->hasRole('admin')) {
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
                'status' => 'cancelled',
                'cancellation_approved_by' => auth()->id(),
                'cancellation_approved_at' => now(),
            ]);

            // potentially reverse the transaction in Loan ledger here if implemented

            return response()->json([
                'status' => 'success',
                'message' => 'Receipt cancellation approved.',
                'data' => $receipt
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to approve cancellation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

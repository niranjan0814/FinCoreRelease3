<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerEditRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CustomerEditRequestController extends Controller
{
    /**
     * List pending customer edit requests for Managers.
     */
    public function index()
    {
        $requests = CustomerEditRequest::with(['customer', 'requester'])
            ->where('status', 'pending')
            ->latest()
            ->get();

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Pending edit requests fetched successfully',
            'data' => $requests
        ]);
    }

    /**
     * Approve an edit request.
     */
    public function approve(Request $request, $id)
    {
        $editRequest = CustomerEditRequest::findOrFail($id);

        if ($editRequest->status !== 'pending') {
            return response()->json([
                'statusCode' => 4000,
                'message' => 'This request has already been processed'
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Apply new details to customer
            $customer = $editRequest->customer;
            $customer->update($editRequest->new_data);
            
            // Clear request flags
            $customer->update([
                'edit_request_status' => 'approved',
                'is_edit_locked' => false
            ]);

            // Update request status
            $editRequest->update([
                'status' => 'approved',
                'approved_by' => auth()->id()
            ]);

            DB::commit();

            return response()->json([
                'statusCode' => 2000,
                'message' => 'Customer changes approved and applied successfully',
                'data' => $customer->load(['branch', 'center', 'group'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'statusCode' => 5000,
                'message' => 'Failed to approve changes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject an edit request.
     */
    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'statusCode' => 4000,
                'message' => 'Rejection reason is required',
                'errors' => $validator->errors()
            ], 400);
        }

        $editRequest = CustomerEditRequest::findOrFail($id);

        if ($editRequest->status !== 'pending') {
            return response()->json([
                'statusCode' => 4000,
                'message' => 'This request has already been processed'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $editRequest->update([
                'status' => 'rejected',
                'rejection_reason' => $request->reason,
                'approved_by' => auth()->id()
            ]);

            // Reset customer flag
            $editRequest->customer->update([
                'edit_request_status' => 'rejected',
                'is_edit_locked' => false
            ]);

            DB::commit();

            return response()->json([
                'statusCode' => 2000,
                'message' => 'Customer changes rejected'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'statusCode' => 5000,
                'message' => 'Failed to reject: ' . $e->getMessage()
            ], 500);
        }
    }
}

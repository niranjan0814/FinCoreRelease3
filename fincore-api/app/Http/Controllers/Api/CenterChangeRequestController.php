<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CenterChangeRequest;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CenterChangeRequestController extends Controller
{
    /**
     * Display a listing of center change requests.
     */
    public function index(Request $request)
    {
        $status = $request->query('status');
        
        $query = CenterChangeRequest::with([
            'customer:id,full_name,customer_code',
            'currentCenter:id,center_name',
            'requestedCenter:id,center_name',
            'requester:id,user_name,email',
            'approver:id,user_name',
        ]);

        if ($status) {
            $query->where('status', $status);
        }

        // Apply role-based filtering if needed (e.g., Field Officers only see their requests)
        // For now, assuming managers/admins can see all, and perhaps FOs can see only theirs?
        // Let's implement a basic check:
        // if (!Auth::user()->can('center_requests.approve')) { 
        //    $query->where('requested_by', Auth::id());
        // }
        
        // Order by created_at desc
        $query->orderBy('created_at', 'desc');

        $requests = $query->paginate(20);

        return response()->json([
            'statusCode' => 200,
            'message' => 'Center change requests retrieved successfully',
            'data' => $requests,
        ]);
    }

    /**
     * Store a newly created center change request.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'requested_center_id' => 'required|exists:centers,id',
            'reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $customer = Customer::findOrFail($request->customer_id);

        if ($customer->center_id == $request->requested_center_id) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Customer is already in the requested center',
            ], 400);
        }

        // Check if there is already a pending request for this customer
        $existingRequest = CenterChangeRequest::where('customer_id', $customer->id)
            ->where('status', 'PENDING')
            ->first();

        if ($existingRequest) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'A pending center change request already exists for this customer',
            ], 400);
        }

        $changeRequest = CenterChangeRequest::create([
            'customer_id' => $customer->id,
            'current_center_id' => $customer->center_id, // Assuming customer must have a center, or handle null
            'requested_center_id' => $request->requested_center_id,
            'reason' => $request->reason,
            'status' => 'PENDING',
            'requested_by' => Auth::id(),
        ]);

        return response()->json([
            'statusCode' => 201,
            'message' => 'Center change request submitted successfully',
            'data' => $changeRequest,
        ], 201);
    }

    /**
     * Approve the specified center change request.
     */
    public function approve(Request $request, $id)
    {
        // Permission check can be handled via middleware in routes
        
        $changeRequest = CenterChangeRequest::findOrFail($id);

        if ($changeRequest->status !== 'PENDING') {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Request is not pending',
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Update customer center
            $customer = Customer::findOrFail($changeRequest->customer_id);
            $customer->center_id = $changeRequest->requested_center_id;
            
            // Also update branch_id if the new center belongs to a different branch?
            // Usually center belongs to a branch. So we should update customer's branch_id too.
            $newCenter = \App\Models\Center::find($changeRequest->requested_center_id);
            if ($newCenter) {
                $customer->branch_id = $newCenter->branch_id;
            }
            
            $customer->save();

            // Update request status
            $changeRequest->status = 'APPROVED';
            $changeRequest->approved_by = Auth::id();
            $changeRequest->approved_at = now();
            $changeRequest->remarks = $request->input('remarks');
            $changeRequest->save();

            DB::commit();

            return response()->json([
                'statusCode' => 200,
                'message' => 'Request approved and customer center updated',
                'data' => $changeRequest,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'statusCode' => 500,
                'message' => 'Failed to approve request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject the specified center change request.
     */
    public function reject(Request $request, $id)
    {
        $changeRequest = CenterChangeRequest::findOrFail($id);

        if ($changeRequest->status !== 'PENDING') {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Request is not pending',
            ], 400);
        }

        $changeRequest->status = 'REJECTED';
        $changeRequest->approved_by = Auth::id(); // Rejected by
        $changeRequest->approved_at = now();
        $changeRequest->remarks = $request->input('remarks'); // Reason for rejection
        $changeRequest->save();

        return response()->json([
            'statusCode' => 200,
            'message' => 'Request rejected',
            'data' => $changeRequest,
        ]);
    }
}

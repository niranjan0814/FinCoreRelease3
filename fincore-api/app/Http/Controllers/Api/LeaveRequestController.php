<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class LeaveRequestController extends Controller
{
    /**
     * Display a listing of all leave requests (Admin only)
     */
    public function index(Request $request)
    {
        $query = LeaveRequest::with(['user', 'approver']);

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $leaveRequests = $query->orderBy('requested_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $leaveRequests->map(function ($request) {
                return [
                    'id' => $request->id,
                    'userId' => $request->user_id,
                    'userName' => $request->user_name,
                    'userRole' => $request->user_role,
                    'startDate' => $request->start_date->format('Y-m-d'),
                    'endDate' => $request->end_date->format('Y-m-d'),
                    'totalDays' => $request->total_days,
                    'reason' => $request->reason,
                    'status' => $request->status,
                    'requestedAt' => $request->requested_at ? $request->requested_at->toIso8601String() : null,
                    'approvedBy' => $request->approved_by,
                    'approvedAt' => $request->approved_at ? $request->approved_at->toIso8601String() : null,
                    'rejectionReason' => $request->rejection_reason
                ];
            })
        ]);
    }

    /**
     * Display the authenticated user's leave requests
     */
    public function myRequests()
    {
        $userId = Auth::id();
        $leaveRequests = LeaveRequest::where('user_id', $userId)
            ->orderBy('requested_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $leaveRequests->map(function ($request) {
                return [
                    'id' => $request->id,
                    'userId' => $request->user_id,
                    'userName' => $request->user_name,
                    'userRole' => $request->user_role,
                    'startDate' => $request->start_date->format('Y-m-d'),
                    'endDate' => $request->end_date->format('Y-m-d'),
                    'totalDays' => $request->total_days,
                    'reason' => $request->reason,
                    'status' => $request->status,
                    'requestedAt' => $request->requested_at ? $request->requested_at->toIso8601String() : null,
                    'approvedBy' => $request->approved_by,
                    'approvedAt' => $request->approved_at ? $request->approved_at->toIso8601String() : null,
                    'rejectionReason' => $request->rejection_reason
                ];
            })
        ]);
    }

    /**
     * Store a newly created leave request
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'startDate' => 'required|date|after_or_equal:today',
            'endDate' => 'required|date|after_or_equal:startDate',
            'reason' => 'required|string|min:3|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $startDate = Carbon::parse($request->startDate);
        $endDate = Carbon::parse($request->endDate);
        
        // Calculate total days (inclusive)
        $totalDays = $startDate->diffInDays($endDate) + 1;

        $leaveRequest = LeaveRequest::create([
            'user_id' => $user->id,
            'user_name' => $user->staff ? $user->staff->full_name : $user->user_name,
            'user_role' => $user->roles->first()->name ?? 'staff',
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_days' => $totalDays,
            'reason' => $request->reason,
            'status' => 'Pending',
            'requested_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Leave request submitted successfully',
            'data' => [
                'id' => $leaveRequest->id,
                'userId' => $leaveRequest->user_id,
                'userName' => $leaveRequest->user_name,
                'userRole' => $leaveRequest->user_role,
                'startDate' => $leaveRequest->start_date->format('Y-m-d'),
                'endDate' => $leaveRequest->end_date->format('Y-m-d'),
                'totalDays' => $leaveRequest->total_days,
                'reason' => $leaveRequest->reason,
                'status' => $leaveRequest->status,
                'requestedAt' => $leaveRequest->requested_at->toIso8601String()
            ]
        ], 201);
    }

    /**
     * Update the status of a leave request (Admin/Manager only)
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Check if user has admin privileges
            $isAdmin = $user && ($user->hasRole('admin') || $user->hasRole('super_admin') || ($user->respondTo('hasPermissionTo') && $user->hasPermissionTo('leave.approve')));
            
            if (!$isAdmin) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. Only administrators can approve leave requests.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:Approved,Rejected',
                'rejection_reason' => 'required_if:status,Rejected|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $leaveRequest = LeaveRequest::findOrFail($id);

            if ($leaveRequest->status !== 'Pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This leave request has already been processed.'
                ], 400);
            }

            $updateData = [
                'status' => $request->status,
                'approved_by' => $user->id,
                'approved_at' => now(),
            ];

            if ($request->status === 'Rejected') {
                $updateData['rejection_reason'] = $request->rejection_reason;
            }

            $leaveRequest->update($updateData);

            return response()->json([
                'status' => 'success',
                'message' => "Leave request {$request->status} successfully",
                'data' => $leaveRequest
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process leave request',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

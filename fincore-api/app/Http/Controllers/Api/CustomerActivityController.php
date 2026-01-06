<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerActivityController extends Controller
{
    /**
     * Get all activities for a specific customer
     */
    public function index($customerId)
    {
        try {
            $activities = CustomerActivity::with('staff')
                ->where('customer_id', $customerId)
                ->orderBy('activity_date', 'desc')
                ->get();

            // Transform specifically for frontend timeline
            $formattedActivities = $activities->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'type' => $activity->activity_type,
                    'description' => $activity->description,
                    'behavior' => $activity->customer_behavior,
                    'outcome' => $activity->outcome,
                    'date' => $activity->activity_date->toIso8601String(),
                    'staff_name' => $activity->staff ? ($activity->staff->full_name ?? $activity->staff->user_name) : 'Unknown Staff',
                    'created_at' => $activity->created_at->toIso8601String(),
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $formattedActivities
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch customer activities',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new activity
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'activity_type' => 'required|string',
            'description' => 'nullable|string',
            'activity_date' => 'required|date',
            'customer_behavior' => 'nullable|string',
            'outcome' => 'nullable|string',
        ]);

        try {
            $activity = CustomerActivity::create([
                'customer_id' => $request->customer_id,
                'staff_id' => auth()->id(),
                'activity_type' => $request->activity_type,
                'description' => $request->description,
                'activity_date' => $request->activity_date,
                'customer_behavior' => $request->customer_behavior,
                'outcome' => $request->outcome,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Activity recorded successfully',
                'data' => $activity
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to record activity',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

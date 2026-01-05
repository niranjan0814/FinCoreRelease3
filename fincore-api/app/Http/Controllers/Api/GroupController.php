<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Group;
use Illuminate\Validation\Rule;

class GroupController extends Controller
{
    /**
     * Display a listing of groups with optional filtering.
     * GET /api/groups
     */
    public function index(Request $request)
    {
        try {
            $query = Group::withCount(['customers', 'loans'])->with(['center.branch']);

            // Apply filters
            if ($request->filled('group_name')) {
                $query->where('group_name', 'LIKE', '%' . $request->group_name . '%');
            }

            if ($request->filled('center_id')) {
                $query->where('center_id', $request->center_id);
            }

            $groups = $query->get();

            return response()->json([
                'status_code' => 2000,
                'http_code' => 200,
                'status' => 'success',
                'message' => $request->hasAny(['group_name', 'center_id']) 
                    ? 'Group filter applied successfully' 
                    : 'Group list fetched successfully',
                'data' => $groups
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status_code' => 5000,
                'http_code' => 500,
                'status' => 'error',
                'message' => 'Failed to retrieve groups',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Store a newly created group.
     * POST /api/groups
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'group_name' => 'required|string|max:255|unique:groups,group_name',
                'center_id' => 'required|integer|exists:centers,id',
                'customer_ids' => 'nullable|array',
                'customer_ids.*' => 'exists:customers,id',
                'status' => 'nullable|string|in:active,inactive'
            ]);

            $group = Group::create($validated);
            $group->load(['center.branch']);

            // Update Customers' group, center, and branch assignment
            if (!empty($validated['customer_ids'])) {
                \App\Models\Customer::whereIn('id', $validated['customer_ids'])
                    ->update([
                        'grp_id' => $group->id,
                        'center_id' => $group->center_id,
                        'branch_id' => $group->center->branch_id ?? null
                    ]);
            }

            return response()->json([
                'status_code' => 2010,
                'http_code' => 201,
                'status' => 'success',
                'message' => 'Group created successfully',
                'data' => $group
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status_code' => 4220,
                'http_code' => 422,
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'status_code' => 5000,
                'http_code' => 500,
                'status' => 'error',
                'message' => 'Failed to create group',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Display the specified group.
     * GET /api/groups/{id}
     */
    public function show($id)
    {
        try {
            // Validate ID format
            if (!is_numeric($id) || $id <= 0) {
                return response()->json([
                    'status_code' => 4000,
                    'http_code' => 400,
                    'status' => 'error',
                    'message' => 'Invalid group ID format'
                ], 400);
            }

            $group = Group::with(['center.branch'])->findOrFail($id);

            return response()->json([
                'status_code' => 2000,
                'http_code' => 200,
                'status' => 'success',
                'message' => 'Group details fetched successfully',
                'data' => $group
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status_code' => 4040,
                'http_code' => 404,
                'status' => 'error',
                'message' => 'Group not found'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'status_code' => 5000,
                'http_code' => 500,
                'status' => 'error',
                'message' => 'Failed to retrieve group',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update the specified group.
     * PUT/PATCH /api/groups/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            // Validate ID format
            if (!is_numeric($id) || $id <= 0) {
                return response()->json([
                    'status_code' => 4000,
                    'http_code' => 400,
                    'status' => 'error',
                    'message' => 'Invalid group ID format'
                ], 400);
            }

            $group = Group::findOrFail($id);

            $validated = $request->validate([
                'group_name' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('groups', 'group_name')->ignore($group->id)
                ],
                'center_id' => 'sometimes|required|integer|exists:centers,id',
                'customer_ids' => 'nullable|array',
                'customer_ids.*' => 'exists:customers,id',
                'status' => 'sometimes|required|string|in:active,inactive'
            ]);

            // Prevent disabling group if there are active loans
            if ($request->status === 'inactive') {
                $hasActiveLoans = \App\Models\Loan::where('group_id', $id)
                    ->whereIn('status', \App\Models\Loan::ACTIVE_STATUSES)
                    ->exists();

                if ($hasActiveLoans) {
                    return response()->json([
                        'status_code' => 4090,
                        'http_code' => 409,
                        'status' => 'error',
                        'message' => 'Cannot disable group',
                        'error' => 'This group has active or pending loans. All loans must be completed or rejected before disabling the group.'
                    ], 409);
                }
            }

            $group->update($validated);
            $group->load(['center.branch']);

            // Sync Customers' group assignment
            if (isset($validated['customer_ids'])) {
                // Get current members
                $currentMemberIds = \App\Models\Customer::where('grp_id', $group->id)->pluck('id')->toArray();
                $newMemberIds = $validated['customer_ids'] ?? [];

                // Identify members being removed
                $removedMemberIds = array_diff($currentMemberIds, $newMemberIds);

                if (!empty($removedMemberIds)) {
                    // Check if any removed member has active loans
                    // Active loans: Status is NOT in CLOSED_STATUSES AND Outstanding Amount > 0
                    $customersWithActiveLoans = \App\Models\Loan::whereIn('customer_id', $removedMemberIds)
                        ->whereNotIn('status', \App\Models\Loan::CLOSED_STATUSES)
                        ->where('outstanding_amount', '>', 0)
                        ->with('customer')
                        ->get();

                    if ($customersWithActiveLoans->isNotEmpty()) {
                        $names = $customersWithActiveLoans->unique('customer_id')
                            ->pluck('customer.full_name')
                            ->join(', ');
                            
                        return response()->json([
                            'status_code' => 4090,
                            'http_code' => 409,
                            'status' => 'error',
                            'message' => "Cannot remove members with active loans: {$names}. Loans must be fully paid first.",
                            'errors' => [
                                'customer_ids' => ["Cannot remove members with active loans: {$names}"]
                            ]
                        ], 409);
                    }
                }

                // Remove group ID from customers previously in this group
                \App\Models\Customer::where('grp_id', $group->id)->update(['grp_id' => null]);

                // Add group ID to new set of customers
                if (!empty($validated['customer_ids'])) {
                    \App\Models\Customer::whereIn('id', $validated['customer_ids'])
                        ->update([
                            'grp_id' => $group->id,
                            'center_id' => $group->center_id,
                            'branch_id' => $group->center->branch_id ?? null
                        ]);
                }
            }

            return response()->json([
                'status_code' => 2000,
                'http_code' => 200,
                'status' => 'success',
                'message' => 'Group updated successfully',
                'data' => $group
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status_code' => 4040,
                'http_code' => 404,
                'status' => 'error',
                'message' => 'Group not found'
            ], 404);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status_code' => 4220,
                'http_code' => 422,
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'status_code' => 5000,
                'http_code' => 500,
                'status' => 'error',
                'message' => 'Failed to update group',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Remove the specified group.
     * DELETE /api/groups/{id}
     */
    public function destroy($id)
    {
        try {
            // Validate ID format
            if (!is_numeric($id) || $id <= 0) {
                return response()->json([
                    'status_code' => 4000,
                    'http_code' => 400,
                    'status' => 'error',
                    'message' => 'Invalid group ID format'
                ], 400);
            }

            $group = Group::findOrFail($id);

            // Optional: Check if group has associated customers before deletion
            // if ($group->customers()->exists()) {
            //     return response()->json([
            //         'status_code' => 4090,
            //         'http_code' => 409,
            //         'status' => 'error',
            //         'message' => 'Cannot delete group with associated customers'
            //     ], 409);
            // }

            $group->delete();

            return response()->json([
                'status_code' => 2000,
                'http_code' => 200,
                'status' => 'success',
                'message' => 'Group deleted successfully'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status_code' => 4040,
                'http_code' => 404,
                'status' => 'error',
                'message' => 'Group not found'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'status_code' => 5000,
                'http_code' => 500,
                'status' => 'error',
                'message' => 'Failed to delete group',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
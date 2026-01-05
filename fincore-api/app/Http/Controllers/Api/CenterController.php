<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Center;
use Illuminate\Validation\Rule;

class CenterController extends Controller
{
    /**
     * Display a listing of centers with optional filtering.
     */
    public function index(Request $request)
    {
        try {
            $query = Center::with(['branch', 'staff'])->withCount(['groups', 'customers']);

            // Filter by CSU_id
            if ($request->has('CSU_id')) {
                $query->where('CSU_id', $request->CSU_id);
            }

            // Filter by center_name (supports partial match)
            if ($request->has('center_name')) {
                $query->where('center_name', 'LIKE', '%' . $request->center_name . '%');
            }

            // Filter by branch_id
            if ($request->has('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }

            // Filter by staff_id
            if ($request->has('staff_id')) {
                $query->where('staff_id', $request->staff_id);
            }

            // Filter by location
            if ($request->has('location')) {
                $query->where('location', 'LIKE', '%' . $request->location . '%');
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $centers = $query->get();

            return response()->json([
                'status' => 'success',
                'data' => $centers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve centers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created center.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'CSU_id' => 'nullable|string|unique:centers,CSU_id',
                'open_days' => 'nullable|array',
                'branch_id' => 'required|exists:branches,id',
                'staff_id' => 'nullable|string|exists:staffs,staff_id',
                'center_name' => 'required|string|max:255',
                'location' => 'nullable|string|max:255',
                'address' => 'nullable|string',
                'group_count' => 'nullable|integer|min:0',
                'status' => 'nullable|string|in:active,inactive',
            ]);

            // Auto-generate CSU_id if not provided
            if (empty($validated['CSU_id'])) {
                $latestCenter = Center::latest('id')->first();
                $nextId = $latestCenter ? $latestCenter->id + 1 : 1;
                $validated['CSU_id'] = 'CSU' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
            }

            // Forced status for Field Officers: Always inactive (pending)
            $user = auth()->user();
            if ($user && $user->hasRole('field_officer')) {
                $validated['status'] = 'inactive';
            } elseif (!isset($validated['status'])) {
                // Default for others if not provided
                $validated['status'] = 'active';
            }

            $center = Center::create($validated);

            // Update Field Officer's assignment
            if (!empty($center->staff_id)) {
                $staff = \App\Models\Staff::where('staff_id', $center->staff_id)->first();
                if ($staff) {
                    $staff->update([
                        'center_id' => $center->id,
                        'branch_id' => $center->branch_id
                    ]);
                }
            }

            $center->load(['branch', 'staff']);

            return response()->json([
                'status' => 'success',
                'message' => 'Center created successfully',
                'data' => $center
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create center',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified center.
     */
    public function show($id)
    {
        try {
            $center = Center::with(['branch', 'staff'])->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $center
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Center not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve center',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified center.
     */
    public function update(Request $request, $id)
    {
        try {
            $center = Center::findOrFail($id);

            $validated = $request->validate([
                'CSU_id' => [
                    'nullable',
                    'string',
                    Rule::unique('centers', 'CSU_id')->ignore($center->id)
                ],
                'open_days' => 'nullable|array',
                'branch_id' => 'sometimes|required|exists:branches,id',
                'staff_id' => 'sometimes|nullable|string|exists:staffs,staff_id',
                'center_name' => 'sometimes|required|string|max:255',
                'location' => 'nullable|string|max:255',
                'address' => 'nullable|string',
                'group_count' => 'nullable|integer|min:0',
                'status' => 'nullable|string|in:active,inactive,rejected,disabled',
            ]);

            // If the center was rejected and is being updated, set it back to inactive (pending)
            if ($center->status === 'rejected') {
                $validated['status'] = 'inactive';
            }

            // Security: Field Officers cannot manually set status to active
            $user = auth()->user();
            if ($user && $user->hasRole('field_officer')) {
                if (isset($validated['status']) && $validated['status'] === 'active') {
                    unset($validated['status']);
                }
            }

            // Prevent disabling center if there are active loans, groups or customers
            if ($request->status === 'disabled') {
                $hasActiveLoans = \App\Models\Loan::where('CSU_id', $id)
                    ->whereIn('status', \App\Models\Loan::ACTIVE_STATUSES)
                    ->exists();

                if ($hasActiveLoans) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Cannot disable center',
                        'error' => 'This center has active or pending loans. All loans must be completed or rejected before disabling the center.'
                    ], 409);
                }

                if ($center->groups()->count() > 0) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Cannot disable center',
                        'error' => 'This center has associated groups. All groups must be removed or moved before disabling the center.'
                    ], 409);
                }

                if ($center->customers()->count() > 0) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Cannot disable center',
                        'error' => 'This center has associated customers. All customers must be removed or moved before disabling the center.'
                    ], 409);
                }
            }

            $center->update($validated);

            // Update Field Officer's assignment on update
            if (!empty($center->staff_id)) {
                $staff = \App\Models\Staff::where('staff_id', $center->staff_id)->first();
                if ($staff) {
                    $staff->update([
                        'center_id' => $center->id,
                        'branch_id' => $center->branch_id
                    ]);
                }
            }

            $center->load(['branch', 'staff']);

            return response()->json([
                'status' => 'success',
                'message' => 'Center updated successfully',
                'data' => $center
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Center not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update center',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function pending()
{
    $centers = Center::where('status', 'inactive')
        ->with(['branch', 'staff'])
        ->get();

    return response()->json([
        'status' => 'success',
        'status_code' => 2000,
        'message' => 'Center approval request fetched',
        'data' => $centers
    ], 200);
}


public function approve($id)
{
    $center = Center::findOrFail($id);

    if ($center->status === 'active') {
        return response()->json([
            'status' => 'error',
            'status_code' => 400,
            'message' => 'Center is already active'
        ], 400);
    }

    $center->update(['status' => 'active']);

    return response()->json([
        'status' => 'success',
        'status_code' => 2000,
        'message' => 'Center approved successfully',
        'data' => $center
    ], 200);
}

    public function reject(Request $request, $id)
    {
        $center = Center::findOrFail($id);
        
        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:1000'
        ]);

        $center->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'] ?? null
        ]);

        return response()->json([
            'status' => 'success',
            'status_code' => 2000,
            'message' => 'Center request rejected successfully'
        ], 200);
    }


    /**
     * Remove the specified center.
     */
    public function destroy($id)
    {
        try {
            $user = auth()->user();
            $center = Center::findOrFail($id);

            // 1. Cannot delete if already active
            if ($center->status === 'active') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Active centers cannot be deleted.'
                ], 403);
            }

            // 2. Role-based deletion rules
            if ($user->hasRole('field_officer')) {
                // Field officers can ONLY delete pending (inactive) requests
                // AND only if they don't have a meeting schedule (indicating they were never operational)
                if ($center->status !== 'inactive') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Field officers can only delete pending center requests.'
                    ], 403);
                }

                if (!empty($center->open_days) && count($center->open_days) > 0) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Cannot delete a center request that already has a meeting schedule configured.'
                    ], 403);
                }
            } elseif (!$user->hasRole('super_admin')) {
                // Non-field officers / Non-super admins cannot delete at all
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized to delete center requests.'
                ], 403);
            }

            // 3. Cannot delete if there are associated groups or customers
            if ($center->groups()->count() > 0 || $center->customers()->count() > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot delete center with associated groups or customers.'
                ], 403);
            }

            $center->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Center request deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Center not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete center',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

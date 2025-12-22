<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\CreateUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Requests\User\ChangePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\StaffDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserController extends BaseController
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::with(['roles', 'permissions', 'staffDetail'])
                ->withCount(['roles', 'permissions']);

            // Search
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('user_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhereHas('staffDetail', function ($q) use ($search) {
                          $q->where('employee_id', 'like', "%{$search}%")
                            ->orWhere('designation', 'like', "%{$search}%")
                            ->orWhere('department', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                      });
                });
            }

            // Filter by role
            if ($request->has('role')) {
                $query->whereHas('roles', function ($q) use ($request) {
                    $q->where('name', $request->role);
                });
            }

            // Filter by status
            if ($request->has('is_active')) {
                $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
                $query->where('is_active', $isActive);
            }

            // Filter by department
            if ($request->has('department')) {
                $query->whereHas('staffDetail', function ($q) use ($request) {
                    $q->where('department', $request->department);
                });
            }

            // Filter by designation
            if ($request->has('designation')) {
                $query->whereHas('staffDetail', function ($q) use ($request) {
                    $q->where('designation', $request->designation);
                });
            }

            // Order by
            $orderBy = $request->get('order_by', 'created_at');
            $orderDirection = $request->get('order_dir', 'desc');
            
            // Handle ordering by staff detail fields
            if (in_array($orderBy, ['employee_id', 'designation', 'department', 'joining_date'])) {
                $query->join('staff_details', 'users.id', '=', 'staff_details.user_id')
                      ->orderBy('staff_details.' . $orderBy, $orderDirection)
                      ->select('users.*');
            } else {
                $query->orderBy($orderBy, $orderDirection);
            }

            $perPage = $request->get('per_page', 20);
            $users = $query->paginate($perPage);

            // Return with UserResource collection
            $users = $query->paginate($perPage);

        // Simple collection with pagination
        $usersCollection = UserResource::collection($users);
        
        // Get the transformed data
        $data = $usersCollection->response()->getData(true);
        
        return response()->json([
            'success' => true,
            'message' => 'Users retrieved successfully',
            'data' => [
                'items' => $data['data'],
                'pagination' => [
                    'total' => $data['meta']['total'] ?? 0,
                    'per_page' => $data['meta']['per_page'] ?? 0,
                    'current_page' => $data['meta']['current_page'] ?? 1,
                    'last_page' => $data['meta']['last_page'] ?? 1,
                    'from' => $data['meta']['from'] ?? 0,
                    'to' => $data['meta']['to'] ?? 0,
                ]
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('Get users error: ' . $e->getMessage(), [
            'request' => $request->all()
        ]);
        return $this->serverError('Failed to retrieve users');
    }
    }

    /**
     * Store a newly created user.
     */
    public function store(CreateUserRequest $request): JsonResponse
    {
        DB::beginTransaction();
        
        try {
            $data = $request->validated();
            $data['password'] = Hash::make($data['password']);
            
            // Extract staff details if present
            $staffDetails = $data['staff_details'] ?? null;
            unset($data['staff_details']);
            
            // Extract roles and permissions
            $roles = $data['roles'] ?? [];
            $permissions = $data['permissions'] ?? [];
            unset($data['roles'], $data['permissions']);

            // Create user
            $user = User::create($data);

            // Create staff details
            if ($staffDetails) {
                $user->staffDetail()->create($staffDetails);
            }

            // Assign roles
            if (!empty($roles)) {
                $user->syncRoles($roles);
            }

            // Assign permissions
            if (!empty($permissions)) {
                $user->syncPermissions($permissions);
            }

            // Log activity
            activity()
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->withProperties([
                    'roles' => $roles,
                    'permissions' => $permissions,
                    'has_staff_details' => !empty($staffDetails)
                ])
                ->log('User created');

            DB::commit();

            // Return with UserResource
            return $this->success(
                new UserResource($user->load(['roles', 'permissions', 'staffDetail'])), 
                'User created successfully', 
                201
            );

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create user error: ' . $e->getMessage(), [
                'request' => $request->all()
            ]);
            return $this->serverError('Failed to create user');
        }
    }

    /**
     * Display the specified user.
     */
    public function show($id): JsonResponse
    {
        try {
            $user = User::with(['roles', 'permissions', 'staffDetail'])
                ->withCount(['roles', 'permissions'])
                ->findOrFail($id);

            // Return with UserResource
            return $this->success(
                new UserResource($user), 
                'User retrieved successfully'
            );

        } catch (\Exception $e) {
            Log::error('Get user error: ' . $e->getMessage(), [
                'user_id' => $id
            ]);
            return $this->notFound('User not found');
        }
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, $id): JsonResponse
    {
        DB::beginTransaction();
        
        try {
            $user = User::with('staffDetail')->findOrFail($id);
            $data = $request->validated();
            
            // Don't update password here
            if (isset($data['password'])) {
                unset($data['password']);
            }
            
            // Extract staff details
            $staffDetails = $data['staff_details'] ?? null;
            unset($data['staff_details']);
            
            // Extract roles and permissions
            $roles = $data['roles'] ?? null;
            $permissions = $data['permissions'] ?? null;
            unset($data['roles'], $data['permissions']);

            // Update user
            $user->update($data);

            // Update or create staff details
            if ($staffDetails !== null) {
                if ($user->staffDetail) {
                    $user->staffDetail()->update($staffDetails);
                } else {
                    $user->staffDetail()->create($staffDetails);
                }
            }

            // Update roles if provided
            if ($roles !== null) {
                $user->syncRoles($roles);
            }

            // Update permissions if provided
            if ($permissions !== null) {
                $user->syncPermissions($permissions);
            }

            // Log activity
            activity()
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->withProperties([
                    'updated_fields' => array_keys($data),
                    'roles_updated' => $roles !== null,
                    'permissions_updated' => $permissions !== null,
                    'staff_details_updated' => $staffDetails !== null
                ])
                ->log('User updated');

            DB::commit();

            // Return with UserResource
            return $this->success(
                new UserResource($user->load(['roles', 'permissions', 'staffDetail'])), 
                'User updated successfully'
            );

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update user error: ' . $e->getMessage(), [
                'user_id' => $id,
                'request' => $request->all()
            ]);
            return $this->serverError('Failed to update user');
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy($id): JsonResponse
    {
        DB::beginTransaction();
        
        try {
            $user = User::findOrFail($id);
            $currentUser = auth()->user();

            // Don't allow self-deletion
            if ($user->id === $currentUser->id) {
                return $this->error('You cannot delete your own account', 400);
            }

            // Don't allow deletion of super admin
            if ($user->isSuperAdmin()) {
                return $this->error('Cannot delete super admin account', 400);
            }

            // Check hierarchy if current user is not super admin
            if (!$currentUser->isSuperAdmin()) {
                $currentUserRole = $currentUser->roles()->first();
                $userRole = $user->roles()->first();
                
                if ($currentUserRole && $userRole && $userRole->hierarchy <= $currentUserRole->hierarchy) {
                    return $this->error('Cannot delete user with equal or higher hierarchy', 400);
                }
            }

            // Log activity before deletion
            activity()
                ->causedBy($currentUser)
                ->performedOn($user)
                ->withProperties([
                    'user_name' => $user->user_name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNamesArray()
                ])
                ->log('User deleted');

            // Soft delete
            $user->delete();

            DB::commit();

            return $this->success(null, 'User deleted successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete user error: ' . $e->getMessage(), [
                'user_id' => $id
            ]);
            return $this->serverError('Failed to delete user');
        }
    }

    /**
     * Change user password
     */
    public function changePassword(ChangePasswordRequest $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $currentUser = auth()->user();
            
            // Verify current password for self password change
            if ($user->id === $currentUser->id && !Hash::check($request->current_password, $user->password)) {
                return $this->error('Current password is incorrect', 400);
            }

            // Check permission for changing others' passwords
            if ($user->id !== $currentUser->id && !$currentUser->hasPermissionTo('users.edit')) {
                return $this->forbidden('You do not have permission to change other users passwords');
            }

            // Update password
            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            // Log activity
            activity()
                ->causedBy($currentUser)
                ->performedOn($user)
                ->log('Password changed');

            return $this->success(null, 'Password changed successfully');

        } catch (\Exception $e) {
            Log::error('Change password error: ' . $e->getMessage(), [
                'user_id' => $id
            ]);
            return $this->serverError('Failed to change password');
        }
    }

    /**
     * Update user status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'is_active' => 'required|boolean'
        ]);

        try {
            $user = User::findOrFail($id);
            $currentUser = auth()->user();
            
            // Don't allow self-deactivation
            if ($user->id === $currentUser->id && !$request->is_active) {
                return $this->error('You cannot deactivate your own account', 400);
            }

            // Don't allow deactivation of super admin
            if ($user->isSuperAdmin() && !$request->is_active) {
                return $this->error('Cannot deactivate super admin account', 400);
            }

            $oldStatus = $user->is_active;
            
            $user->update(['is_active' => $request->is_active]);

            // Log activity
            activity()
                ->causedBy($currentUser)
                ->performedOn($user)
                ->withProperties([
                    'old_status' => $oldStatus,
                    'new_status' => $request->is_active
                ])
                ->log('User status updated');

            // Return with UserResource
            return $this->success(
                new UserResource($user), 
                'User status updated successfully'
            );

        } catch (\Exception $e) {
            Log::error('Update status error: ' . $e->getMessage(), [
                'user_id' => $id,
                'status' => $request->is_active
            ]);
            return $this->serverError('Failed to update user status');
        }
    }

    /**
     * Unlock user account
     */
    public function unlock($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            if (!$user->is_locked) {
                return $this->error('User account is not locked', 400);
            }

            $user->unlockAccount();

            // Log activity
            activity()
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->log('User account unlocked');

            // Return with UserResource
            return $this->success(
                new UserResource($user), 
                'User account unlocked successfully'
            );

        } catch (\Exception $e) {
            Log::error('Unlock user error: ' . $e->getMessage(), [
                'user_id' => $id
            ]);
            return $this->serverError('Failed to unlock user account');
        }
    }

    /**
     * Get user statistics
     */
    public function getStatistics($id): JsonResponse
    {
        try {
            $user = User::with(['staffDetail'])->findOrFail($id);

            // Basic statistics
            $statistics = [
                'basic_info' => [
                    'user_name' => $user->user_name,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'last_login' => $user->last_login_at,
                    'failed_login_attempts' => $user->failed_login_attempts,
                    'is_locked' => $user->is_locked,
                    'account_created' => $user->created_at,
                ],
                'roles_and_permissions' => [
                    'roles_count' => $user->roles()->count(),
                    'permissions_count' => $user->getAllPermissions()->count(),
                    'direct_permissions_count' => $user->permissions()->count(),
                    'roles' => $user->getRoleNamesArray(),
                ],
                'activity' => [
                    'total_logins' => $user->last_login_at ? 1 : 0, // Simplified
                    'account_age_days' => $user->created_at->diffInDays(now()),
                ]
            ];

            // Add staff details if available
            if ($user->staffDetail) {
                $statistics['staff_info'] = [
                    'employee_id' => $user->staffDetail->employee_id,
                    'designation' => $user->staffDetail->designation,
                    'department' => $user->staffDetail->department,
                    'phone' => $user->staffDetail->phone,
                    'joining_date' => $user->staffDetail->joining_date,
                    'employment_type' => $user->staffDetail->employment_type,
                    'employment_status' => $user->staffDetail->employment_status,
                ];
            }

            return $this->success($statistics, 'User statistics retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Get user statistics error: ' . $e->getMessage(), [
                'user_id' => $id
            ]);
            return $this->serverError('Failed to retrieve user statistics');
        }
    }

    /**
     * Get user activity log
     */
    public function getActivityLog($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            // Get activities related to this user
            $activities = \Spatie\Activitylog\Models\Activity::where('causer_id', $id)
                ->orWhere('subject_id', $id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return $this->paginated($activities, 'User activity log retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Get user activity log error: ' . $e->getMessage(), [
                'user_id' => $id
            ]);
            return $this->serverError('Failed to retrieve user activity log');
        }
    }

    /**
     * Bulk update user status
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'is_active' => 'required|boolean'
        ]);

        DB::beginTransaction();
        
        try {
            $currentUser = auth()->user();
            $userIds = $request->user_ids;
            $isActive = $request->is_active;

            // Don't allow self-deactivation in bulk
            if (!$isActive && in_array($currentUser->id, $userIds)) {
                return $this->error('Cannot deactivate your own account in bulk operation', 400);
            }

            // Don't allow deactivation of super admin
            if (!$isActive) {
                $superAdmins = User::whereIn('id', $userIds)
                    ->whereHas('roles', function ($q) {
                        $q->where('name', 'super_admin');
                    })->count();
                
                if ($superAdmins > 0) {
                    return $this->error('Cannot deactivate super admin accounts', 400);
                }
            }

            $updatedCount = User::whereIn('id', $userIds)->update(['is_active' => $isActive]);

            // Get updated users for response
            $updatedUsers = User::whereIn('id', $userIds)->get();

            // Log activity
            activity()
                ->causedBy($currentUser)
                ->withProperties([
                    'user_ids' => $userIds,
                    'is_active' => $isActive,
                    'updated_count' => $updatedCount
                ])
                ->log('Bulk user status update');

            DB::commit();

            // Alternative 1: Using success() method from BaseController
            return $this->success([
                'users' => UserResource::collection($updatedUsers),
                'updated_count' => $updatedCount,
                'is_active' => $isActive,
                'affected_users' => $userIds
            ], 'Bulk status update completed successfully');

            // Alternative 2: Manual response building
            // return response()->json([
            //     'success' => true,
            //     'message' => 'Bulk status update completed successfully',
            //     'data' => [
            //         'users' => UserResource::collection($updatedUsers),
            //         'meta' => [
            //             'updated_count' => $updatedCount,
            //             'is_active' => $isActive,
            //             'affected_users' => $userIds
            //         ]
            //     ]
            // ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk update status error: ' . $e->getMessage(), [
                'request' => $request->all()
            ]);
            return $this->serverError('Failed to perform bulk status update');
        }
    }
}
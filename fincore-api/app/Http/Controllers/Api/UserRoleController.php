<?php

namespace App\Http\Controllers\Api;

use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserRoleController extends BaseController
{
    protected $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
        
        // Middleware
        $this->middleware(['auth:sanctum', 'permission:users.roles.manage']);
    }

    /**
     * Assign role to user
     */
    public function assignRole(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);
        
        try {
            $data = $this->roleService->assignRoleToUser($userId, $request->role_id);
            
            return $this->success($data, 'Role assigned successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Remove role from user
     */
    public function removeRole(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);
        
        try {
            $data = $this->roleService->removeRoleFromUser($userId, $request->role_id);
            
            return $this->success($data, 'Role removed successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Sync roles for user
     */
    public function syncRoles(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,id',
        ]);
        
        try {
            $user = \App\Models\User::findOrFail($userId);
            
            // Check hierarchy for each role
            $currentUser = auth()->user();
            if (!$currentUser->isSuperAdmin()) {
                $currentRole = $currentUser->roles()->first();
                if ($currentRole) {
                    $roles = \App\Models\Role::whereIn('id', $request->roles)->get();
                    foreach ($roles as $role) {
                        if ($role->hierarchy <= $currentRole->hierarchy) {
                            return $this->error('Cannot assign role with equal or higher hierarchy: ' . $role->name);
                        }
                    }
                }
            }
            
            $user->syncRoles($request->roles);
            
            return $this->success($user->load('roles'), 'Roles synced successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get user roles
     */
    public function getUserRoles($userId): JsonResponse
    {
        try {
            $user = \App\Models\User::with('roles')->findOrFail($userId);
            
            return $this->success($user->roles, 'User roles retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
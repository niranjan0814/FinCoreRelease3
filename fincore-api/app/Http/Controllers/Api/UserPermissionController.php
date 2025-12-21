<?php

namespace App\Http\Controllers\Api;

use App\Services\UserPermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserPermissionController extends BaseController
{
    protected $userPermissionService;

    public function __construct(UserPermissionService $userPermissionService)
    {
        $this->userPermissionService = $userPermissionService;
        
        // Middleware
        $this->middleware(['auth:sanctum', 'permission:users.permissions.manage']);
    }

    /**
     * Get user permissions
     */
    public function show($userId): JsonResponse
    {
        try {
            $data = $this->userPermissionService->getUserPermissions($userId);
            
            return $this->success($data, 'User permissions retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Assign direct permission to user
     */
    public function assignPermission(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);
        
        try {
            $data = $this->userPermissionService->assignDirectPermission($userId, $request->permission_id);
            
            return $this->success($data, 'Permission assigned successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Remove direct permission from user
     */
    public function removePermission(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);
        
        try {
            $data = $this->userPermissionService->removeDirectPermission($userId, $request->permission_id);
            
            return $this->success($data, 'Permission removed successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Sync direct permissions for user
     */
    public function syncPermissions(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);
        
        try {
            $user = $this->userPermissionService->syncDirectPermissions($userId, $request->permissions);
            
            return $this->success($user, 'Permissions synced successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Check if user has permission
     */
    public function hasPermission(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'permission' => 'required|string',
        ]);
        
        try {
            $hasPermission = $this->userPermissionService->userHasPermission($userId, $request->permission);
            
            return $this->success([
                'has_permission' => $hasPermission,
            ], 'Permission check completed');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get permission breakdown for user
     */
    public function breakdown($userId): JsonResponse
    {
        try {
            $data = $this->userPermissionService->getPermissionBreakdown($userId);
            
            return $this->success($data, 'Permission breakdown retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get users with specific permission
     */
    public function usersWithPermission(Request $request): JsonResponse
    {
        $request->validate([
            'permission' => 'required|string',
        ]);
        
        try {
            $users = $this->userPermissionService->getUsersWithPermission($request->permission);
            
            return $this->success($users, 'Users retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
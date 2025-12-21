<?php

namespace App\Services;

use App\Models\User;
use App\Models\Permission;

class UserPermissionService
{
    /**
     * Get user with all permissions
     */
    public function getUserPermissions($userId)
    {
        $user = User::with(['roles.permissions', 'permissions'])->findOrFail($userId);
        
        $rolePermissions = $user->roles->flatMap(function ($role) {
            return $role->permissions;
        })->unique('id');
        
        $directPermissions = $user->permissions;
        
        $allPermissions = $rolePermissions->merge($directPermissions)->unique('id');
        
        return [
            'user' => $user,
            'role_permissions' => $rolePermissions,
            'direct_permissions' => $directPermissions,
            'all_permissions' => $allPermissions,
            'permission_names' => $allPermissions->pluck('name')->toArray(),
        ];
    }

    /**
     * Assign direct permission to user
     */
    public function assignDirectPermission($userId, $permissionId)
    {
        $user = User::findOrFail($userId);
        $permission = Permission::findOrFail($permissionId);
        
        $user->givePermissionTo($permission);
        
        return [
            'user' => $user->load('permissions'),
            'permission' => $permission,
        ];
    }

    /**
     * Remove direct permission from user
     */
    public function removeDirectPermission($userId, $permissionId)
    {
        $user = User::findOrFail($userId);
        $permission = Permission::findOrFail($permissionId);
        
        $user->revokePermissionTo($permission);
        
        return [
            'user' => $user->load('permissions'),
            'permission' => $permission,
        ];
    }

    /**
     * Sync direct permissions for user
     */
    public function syncDirectPermissions($userId, array $permissionIds)
    {
        $user = User::findOrFail($userId);
        
        $permissions = Permission::whereIn('id', $permissionIds)->get();
        $user->syncPermissions($permissions);
        
        return $user->load('permissions');
    }

    /**
     * Check if user has permission
     */
    public function userHasPermission($userId, $permissionName)
    {
        $user = User::findOrFail($userId);
        return $user->hasPermissionTo($permissionName);
    }

    /**
     * Get users with specific permission
     */
    public function getUsersWithPermission($permissionName)
    {
        $permission = Permission::where('name', $permissionName)->first();
        
        if (!$permission) {
            return collect();
        }
        
        // Get users with direct permission
        $directUsers = User::permission($permissionName)->get();
        
        // Get users with permission through role
        $roleUsers = User::whereHas('roles.permissions', function ($query) use ($permission) {
            $query->where('permission_id', $permission->id);
        })->get();
        
        return $directUsers->merge($roleUsers)->unique('id');
    }

    /**
     * Get permission breakdown for user
     */
    public function getPermissionBreakdown($userId)
    {
        $user = User::with(['roles.permissions', 'permissions'])->findOrFail($userId);
        
        $permissions = [
            'through_roles' => [],
            'direct' => [],
            'all' => [],
        ];
        
        foreach ($user->roles as $role) {
            foreach ($role->permissions as $permission) {
                $permissions['through_roles'][$permission->id] = [
                    'permission' => $permission,
                    'role' => $role,
                ];
            }
        }
        
        foreach ($user->permissions as $permission) {
            $permissions['direct'][$permission->id] = [
                'permission' => $permission,
                'direct' => true,
            ];
        }
        
        $permissions['all'] = array_merge($permissions['through_roles'], $permissions['direct']);
        
        return [
            'user' => $user,
            'permissions' => $permissions,
            'total_count' => count($permissions['all']),
        ];
    }
}
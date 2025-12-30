<?php

namespace App\Services;

use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

class RoleService
{
    /**
     * Get all roles with pagination and filters
     */
    public function getAllRoles(array $filters = [], int $perPage = 20)
    {
        $query = Role::query();

        // Filter by name
        if (isset($filters['name'])) {
            $query->where('name', 'like', '%' . $filters['name'] . '%')
                  ->orWhere('display_name', 'like', '%' . $filters['name'] . '%');
        }

        // Filter by level
        if (isset($filters['level'])) {
            $query->where('level', $filters['level']);
        }

        // Filter by hierarchy (only show roles below current user)
        $user = auth()->user();
        if ($user) {
            $query->where('hierarchy', '>', $user->getRoleHierarchy());
        }

        // Sort
        $sortField = $filters['sort_by'] ?? 'hierarchy';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $query->orderBy($sortField, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Create a new role
     */
    public function createRole(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->validateHierarchy($data['hierarchy'] ?? 100);

            $role = Role::create([
                'name' => $data['name'],
                'display_name' => $data['display_name'] ?? ucwords(str_replace('_', ' ', $data['name'])),
                'description' => $data['description'] ?? null,
                'level' => $data['level'] ?? 'staff',
                'hierarchy' => $data['hierarchy'] ?? 100,
                'guard_name' => 'web',
                'is_system' => false,
                'is_editable' => true,
                'is_default' => $data['is_default'] ?? false,
            ]);

            if (isset($data['permissions'])) {
                $this->validatePermissionSubset($data['permissions']);
                $this->validateAdminPermissions($data['permissions']);
                $role->syncPermissions($data['permissions']);
            }

            return $role;
        });
    }

    /**
     * Get role by ID
     */
    public function getRoleById($id)
    {
        $role = Role::with('permissions')->findOrFail($id);
        $user = auth()->user();
        
        if ($user && $role->hierarchy <= $user->getRoleHierarchy()) {
            throw new \Exception("Unauthorized: Role level is restricted.");
        }
        
        return $role;
    }

    /**
     * Update a role
     */
    public function updateRole($id, array $data)
    {
        $role = Role::findOrFail($id);
        $user = auth()->user();

        if ($user && $role->hierarchy <= $user->getRoleHierarchy()) {
            throw new \Exception("Unauthorized: Cannot update role with equal or higher hierarchy.");
        }

        if (!$role->is_editable) {
            throw new \Exception("Values for this role cannot be edited.");
        }

        // Block escalation to super_admin level
        if (isset($data['level']) && $data['level'] === 'super_admin' && $role->level !== 'super_admin') {
            throw new \Exception("The super_admin level is protected and cannot be assigned.");
        }

        return DB::transaction(function () use ($role, $data) {
            if (isset($data['hierarchy'])) {
                $this->validateHierarchy($data['hierarchy']);
            }

            $role->update([
                'display_name' => $data['display_name'] ?? $role->display_name,
                'description' => $data['description'] ?? $role->description,
                'level' => $data['level'] ?? $role->level,
                'hierarchy' => $data['hierarchy'] ?? $role->hierarchy,
                'is_default' => $data['is_default'] ?? $role->is_default,
                'is_editable' => $data['is_editable'] ?? $role->is_editable,
                'restrictions' => $data['restrictions'] ?? $role->restrictions,
            ]);

            // Handle permission_matrix - dynamically create missing permissions
            if (isset($data['permission_matrix']) && is_array($data['permission_matrix'])) {
                $permissionIds = $this->resolvePermissionMatrix($data['permission_matrix']);
                
                if (!empty($permissionIds)) {
                    // Skip validation for super_admin
                    if (!auth()->user()->isSuperAdmin()) {
                        $this->validatePermissionSubset($permissionIds);
                        $this->validateAdminPermissions($permissionIds);
                    }
                    $role->syncPermissions($permissionIds);
                } else {
                    // Clear all permissions if matrix is empty
                    $role->syncPermissions([]);
                }
            } elseif (isset($data['permissions'])) {
                // Fallback to old behavior with permission IDs
                $this->validatePermissionSubset($data['permissions']);
                $this->validateAdminPermissions($data['permissions']);
                $role->syncPermissions($data['permissions']);
            }

            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return $role->refresh()->load('permissions');
        });
    }

    /**
     * Resolve permission matrix to permission IDs, creating missing permissions as needed
     */
    protected function resolvePermissionMatrix(array $matrix): array
    {
        $permissionIds = [];

        foreach ($matrix as $item) {
            if (!isset($item['module']) || !isset($item['action'])) {
                continue;
            }

            $module = $item['module'];
            $action = $item['action'];
            $permissionName = $module . '.' . $action;

            // Find or create the permission
            $permission = Permission::where('name', $permissionName)->first();

            if (!$permission) {
                // Create the permission dynamically
                $permission = Permission::create([
                    'name' => $permissionName,
                    'display_name' => ucfirst($module) . ' ' . ucwords(str_replace('_', ' ', $action)),
                    'module' => $module,
                    'guard_name' => 'web',
                    'is_core' => false, // Dynamically created permissions are not core
                ]);

                \Log::info("Dynamically created permission: {$permissionName}");
            }

            $permissionIds[] = $permission->id;
        }

        return array_unique($permissionIds);
    }

    /**
     * Delete a role
     */
    public function deleteRole($id)
    {
        $role = Role::findOrFail($id);
        $user = auth()->user();

        if ($user && $role->hierarchy <= $user->getRoleHierarchy()) {
            throw new \Exception("Unauthorized: Cannot delete role with equal or higher hierarchy.");
        }

        if ($role->is_system || $role->level === 'super_admin') {
            throw new \Exception("System and Super Admin roles cannot be deleted.");
        }

        if ($role->users()->count() > 0) {
            throw new \Exception("Cannot delete role with assigned users.");
        }

        return $role->delete();
    }

    /**
     * Sync permissions to role
     */
    public function syncRolePermissions($id, array $permissions)
    {
        $role = Role::findOrFail($id);
        
        if ($role->level === 'super_admin' && !auth()->user()->isSuperAdmin()) {
            throw new \Exception("Only Super Admins can modify Super Admin permissions.");
        }

        $this->validatePermissionSubset($permissions);
        $this->validateAdminPermissions($permissions);
        
        $role->syncPermissions($permissions);
        return $role->load('permissions');
    }

    /**
     * Validate hierarchy level against current user's level
     */
    protected function validateHierarchy(int $targetHierarchy)
    {
        $user = auth()->user();
        if (!$user) return;

        // If user is Super Admin, they can create anything except level 1
        if ($user->isSuperAdmin()) {
            if ($targetHierarchy <= 1) {
                throw new \Exception("Hierarchy level 1 is strictly reserved for the primary system administrator.");
            }
            return;
        }

        // Other users must create roles strictly BELOW their own level
        $currentHierarchy = $user->getRoleHierarchy();
        if ($targetHierarchy <= $currentHierarchy) {
            throw new \Exception("Authorization Error: You can only manage roles with a hierarchy value strictly greater than yours (currently {$currentHierarchy}). You cannot create or modify roles at your own level or above.");
        }
    }

    /**
     * Ensure the given permissions are a subset of the user's own permissions
     */
    protected function validatePermissionSubset(array $permissionIds)
    {
        $user = auth()->user();
        if (!$user || $user->isSuperAdmin()) return;

        $userPermissions = $user->getAllPermissions()->pluck('id')->toArray();
        $invalidPermissions = array_diff($permissionIds, $userPermissions);

        if (!empty($invalidPermissions)) {
            $invalidNames = Permission::whereIn('id', $invalidPermissions)->pluck('name')->toArray();
            throw new \Exception("Authorization Error: You cannot grant permissions that you do not possess yourself. Missing: " . implode(', ', $invalidNames));
        }
    }

    /**
     * Validate if current user can assign admin permissions
     */
    protected function validateAdminPermissions(array $permissionIds)
    {
        $user = auth()->user();
        
        $adminPermissionsCount = Permission::whereIn('id', $permissionIds)
            ->where('module', 'admins')
            ->count();

        if ($adminPermissionsCount > 0 && !$user->hasPermissionTo('users.permissions.manage')) {
            throw new \Exception("You do not have permission to assign or manage 'Admin Management' permissions.");
        }
    }

    /**
     * Assign permissions to role
     */
    public function assignPermissionsToRole($id, array $permissions)
    {
        $role = Role::findOrFail($id);
        $this->validateAdminPermissions($permissions);
        $role->givePermissionTo($permissions);
        return $role->load('permissions');
    }

    /**
     * Remove permissions from role
     */
    public function removePermissionsFromRole($id, array $permissions)
    {
        $role = Role::findOrFail($id);
        $role->revokePermissionTo($permissions);
        return $role->load('permissions');
    }

    /**
     * Get system roles
     */
    public function getSystemRoles()
    {
        return Role::where('is_system', true)->get();
    }

    /**
     * Get roles by level
     */
    public function getRolesByLevel($level)
    {
        return Role::where('level', $level)->get();
    }

    /**
     * Get default role
     */
    public function getDefaultRole()
    {
        return Role::where('is_default', true)->first();
    }
}
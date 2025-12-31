<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\PermissionGroup;
use Illuminate\Support\Str;

class PermissionService
{
    /**
     * Get all permissions with pagination
     */
    public function getAllPermissions($filters = [], $perPage = 20)
    {
        $query = Permission::with('group')->ordered();

        if (!empty($filters['group_id'])) {
            $query->where('permission_group_id', $filters['group_id']);
        }

        if (!empty($filters['module'])) {
            $query->where('module', $filters['module']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('display_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['is_core'])) {
            $query->where('is_core', filter_var($filters['is_core'], FILTER_VALIDATE_BOOLEAN));
        }

        // Filter out 'admins' module if user doesn't have explicit permission
        $user = auth()->user();
        if ($user && !$user->hasPermissionTo('users.permissions.manage')) {
            $query->where('module', '!=', 'admins');
        }

        return $query->paginate($perPage);
    }

    /**
     * Get permission by ID
     */
    public function getPermissionById($id)
    {
        return Permission::with('group')->findOrFail($id);
    }

    /**
     * Create a new permission
     */
    public function createPermission(array $data)
    {
        $data['name'] = Str::slug($data['name'], '.');
        $data['guard_name'] = $data['guard_name'] ?? 'web';

        // Auto-assign group if name uses dot notation and no group is provided
        if (empty($data['permission_group_id']) && str_contains($data['name'], '.')) {
            $parts = explode('.', $data['name']);
            $module = $parts[0]; // 'collection'
            $action = end($parts); // 'view'
            
            // Normalize slug to match seeder convention (e.g., 'collection' -> 'collection-management')
            $groupSlug = Str::slug($module . ' management');
            
            // Find or create group with 'Management' naming convention
            $group = PermissionGroup::firstOrCreate(
                ['slug' => $groupSlug],
                [
                    'name' => Str::title($module) . ' Management', // 'Collection Management'
                    'description' => 'Manage ' . Str::title($module) . ' related permissions',
                    'icon' => 'folder-open', // Default icon
                    'color' => 'blue',       // Default color
                    'is_active' => true,
                    'order' => 99
                ]
            );
            
            $data['permission_group_id'] = $group->id;
            
            // Auto-fill module if missing
            if (empty($data['module'])) {
                $data['module'] = $module;
            }
            
            // Auto-fill display name if missing
            if (empty($data['display_name'])) {
                // 'collection.view' -> 'View Collection'
                $data['display_name'] = Str::title(str_replace(['_', '-'], ' ', $action) . ' ' . $module);
            }
        }
        
        return Permission::create($data);
    }

    /**
     * Update permission
     */
    public function updatePermission($id, array $data)
    {
        $permission = Permission::findOrFail($id);
        
        if (isset($data['name'])) {
            $data['name'] = Str::slug($data['name'], '.');
        }
        
        $permission->update($data);
        
        return $permission;
    }

    /**
     * Delete permission
     */
    public function deletePermission($id)
    {
        $permission = Permission::findOrFail($id);
        
        // Don't allow deletion of core permissions
        if ($permission->is_core) {
            throw new \Exception('Cannot delete core permission');
        }
        
        // Check if permission is assigned to any role
        if ($permission->roles()->count() > 0) {
            throw new \Exception('Cannot delete permission assigned to roles');
        }
        
        $permission->delete();
        
        return $permission;
    }

    /**
     * Get permission groups
     */
    public function getPermissionGroups()
    {
        return PermissionGroup::active()->ordered()->get();
    }

    /**
     * Create permission group
     */
    public function createPermissionGroup(array $data)
    {
        $data['slug'] = Str::slug($data['name']);
        
        return PermissionGroup::create($data);
    }

    /**
     * Get permissions by module
     */
    public function getPermissionsByModule($module)
    {
        return Permission::byModule($module)->ordered()->get();
    }

    /**
     * Get all modules
     */
    public function getAllModules()
    {
        $query = Permission::query()->distinct();
        
        $user = auth()->user();
        if ($user && !$user->hasPermissionTo('users.permissions.manage')) {
            $query->where('module', '!=', 'admins');
        }

        return $query->pluck('module')->filter()->values();
    }

    /**
     * Sync module permissions (for new module installation)
     */
    public function syncModulePermissions($module, array $permissions)
    {
        $existingPermissions = Permission::byModule($module)->pluck('name')->toArray();
        
        $newPermissions = [];
        $updatedPermissions = [];
        
        foreach ($permissions as $permission) {
            $permission['module'] = $module;
            $permission['guard_name'] = $permission['guard_name'] ?? 'web';
            $permission['name'] = Str::slug($permission['name'], '.');
            
            if (in_array($permission['name'], $existingPermissions)) {
                // Update existing permission
                Permission::where('name', $permission['name'])->update($permission);
                $updatedPermissions[] = $permission['name'];
            } else {
                // Create new permission
                Permission::create($permission);
                $newPermissions[] = $permission['name'];
            }
        }
        
        // Remove permissions not in the new list
        $permissionsToRemove = array_diff($existingPermissions, array_column($permissions, 'name'));
        Permission::whereIn('name', $permissionsToRemove)->delete();
        
        return [
            'new' => $newPermissions,
            'updated' => $updatedPermissions,
            'removed' => $permissionsToRemove,
        ];
    }
}
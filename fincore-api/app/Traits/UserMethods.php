<?php

namespace App\Traits;

trait UserMethods
{
    /**
     * Get all permission names
     */
    public function getAllPermissionNames(): array
    {
        return $this->getAllPermissions()->pluck('name')->toArray();
    }

    /**
     * Get role names as array
     */
    public function getRoleNamesArray(): array
    {
        return $this->getRoleNames()->toArray();
    }

    /**
     * Get direct permission names
     */
    public function getDirectPermissionNames(): array
    {
        return $this->permissions()->pluck('name')->toArray();
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Get permissions by module
     */
    public function getPermissionsByModule(): array
    {
        $permissions = $this->getAllPermissions();
        
        $grouped = [];
        foreach ($permissions as $permission) {
            $module = $permission->module ?? 'other';
            if (!isset($grouped[$module])) {
                $grouped[$module] = [];
            }
            $grouped[$module][] = $permission->name;
        }
        
        return $grouped;
    }

    /**
     * Get user's role hierarchy
     */
    public function getRoleHierarchy(): int
    {
        $highestRole = $this->roles()->orderBy('hierarchy')->first();
        return $highestRole ? $highestRole->hierarchy : 1000;
    }

    /**
     * Check if user can manage another user
     */
    public function canManageUser($otherUser): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        
        if (!($otherUser instanceof \App\Models\User)) {
            return false;
        }
        
        return $this->getRoleHierarchy() < $otherUser->getRoleHierarchy();
    }
}
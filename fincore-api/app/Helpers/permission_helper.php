<?php

if (!function_exists('get_all_permissions')) {
    function get_all_permissions()
    {
        return \App\Models\Permission::ordered()->get();
    }
}

if (!function_exists('get_permission_groups')) {
    function get_permission_groups()
    {
        return \App\Models\PermissionGroup::active()->ordered()->get();
    }
}

if (!function_exists('get_roles_by_level')) {
    function get_roles_by_level($level)
    {
        return \App\Models\Role::byLevel($level)->editable()->ordered()->get();
    }
}

if (!function_exists('has_permission')) {
    function has_permission($permission)
    {
        $user = auth()->user();
        
        if (!$user) {
            return false;
        }
        
        return $user->hasPermissionTo($permission);
    }
}

if (!function_exists('has_any_permission')) {
    function has_any_permission(array $permissions)
    {
        $user = auth()->user();
        
        if (!$user) {
            return false;
        }
        
        return $user->hasAnyPermission($permissions);
    }
}

if (!function_exists('has_all_permissions')) {
    function has_all_permissions(array $permissions)
    {
        $user = auth()->user();
        
        if (!$user) {
            return false;
        }
        
        return $user->hasAllPermissions($permissions);
    }
}

if (!function_exists('is_super_admin')) {
    function is_super_admin()
    {
        $user = auth()->user();
        
        if (!$user) {
            return false;
        }
        
        return $user->isSuperAdmin();
    }
}

if (!function_exists('is_admin')) {
    function is_admin()
    {
        $user = auth()->user();
        
        if (!$user) {
            return false;
        }
        
        return $user->isAdmin();
    }
}
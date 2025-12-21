<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Role\CreateRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends BaseController
{
    protected $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
        
        // Middleware
        $this->middleware(['auth:sanctum', 'permission:roles.view']);
        $this->middleware(['permission:roles.create'], ['only' => ['store']]);
        $this->middleware(['permission:roles.edit'], ['only' => ['update', 'syncPermissions']]);
        $this->middleware(['permission:roles.delete'], ['only' => ['destroy']]);
    }

    /**
     * Get all roles
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $roles = $this->roleService->getAllRoles(
                $request->all(),
                $request->get('per_page', 20)
            );
            
            return $this->paginated($roles, 'Roles retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Create new role
     */
    public function store(CreateRoleRequest $request): JsonResponse
    {
        try {
            $role = $this->roleService->createRole($request->validated());
            
            return $this->success($role, 'Role created successfully', 201);
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get role by ID
     */
    public function show($id): JsonResponse
    {
        try {
            $role = $this->roleService->getRoleById($id);
            
            return $this->success($role, 'Role retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /**
     * Update role
     */
    public function update(UpdateRoleRequest $request, $id): JsonResponse
    {
        try {
            $role = $this->roleService->updateRole($id, $request->validated());
            
            return $this->success($role, 'Role updated successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Delete role
     */
    public function destroy($id): JsonResponse
    {
        try {
            $this->roleService->deleteRole($id);
            
            return $this->success(null, 'Role deleted successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Sync permissions for role
     */
    public function syncPermissions(Request $request, $id): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);
        
        try {
            $role = $this->roleService->syncRolePermissions($id, $request->permissions);
            
            return $this->success($role, 'Permissions synced successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Assign permissions to role
     */
    public function assignPermissions(Request $request, $id): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);
        
        try {
            $role = $this->roleService->assignPermissionsToRole($id, $request->permissions);
            
            return $this->success($role, 'Permissions assigned successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Remove permissions from role
     */
    public function removePermissions(Request $request, $id): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);
        
        try {
            $role = $this->roleService->removePermissionsFromRole($id, $request->permissions);
            
            return $this->success($role, 'Permissions removed successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get system roles
     */
    public function systemRoles(): JsonResponse
    {
        try {
            $roles = $this->roleService->getSystemRoles();
            
            return $this->success($roles, 'System roles retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get roles by level
     */
    public function byLevel($level): JsonResponse
    {
        try {
            $roles = $this->roleService->getRolesByLevel($level);
            
            return $this->success($roles, 'Roles retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get default role
     */
    public function defaultRole(): JsonResponse
    {
        try {
            $role = $this->roleService->getDefaultRole();
            
            return $this->success($role, 'Default role retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
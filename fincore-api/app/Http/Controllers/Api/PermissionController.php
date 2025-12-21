<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Permission\CreatePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use App\Services\PermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends BaseController
{
    protected $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
        
        // Middleware
        $this->middleware(['auth:sanctum', 'permission:permissions.view']);
        $this->middleware(['permission:permissions.create'], ['only' => ['store']]);
        $this->middleware(['permission:permissions.edit'], ['only' => ['update']]);
        $this->middleware(['permission:permissions.delete'], ['only' => ['destroy']]);
    }

    /**
     * Get all permissions
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $permissions = $this->permissionService->getAllPermissions(
                $request->all(),
                $request->get('per_page', 20)
            );
            
            return $this->paginated($permissions, 'Permissions retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Create new permission
     */
    public function store(CreatePermissionRequest $request): JsonResponse
    {
        try {
            $permission = $this->permissionService->createPermission($request->validated());
            
            return $this->success($permission, 'Permission created successfully', 201);
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get permission by ID
     */
    public function show($id): JsonResponse
    {
        try {
            $permission = $this->permissionService->getPermissionById($id);
            
            return $this->success($permission, 'Permission retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /**
     * Update permission
     */
    public function update(UpdatePermissionRequest $request, $id): JsonResponse
    {
        try {
            $permission = $this->permissionService->updatePermission($id, $request->validated());
            
            return $this->success($permission, 'Permission updated successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Delete permission
     */
    public function destroy($id): JsonResponse
    {
        try {
            $this->permissionService->deletePermission($id);
            
            return $this->success(null, 'Permission deleted successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get permission groups
     */
    public function groups(): JsonResponse
    {
        try {
            $groups = $this->permissionService->getPermissionGroups();
            
            return $this->success($groups, 'Permission groups retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Create permission group
     */
    public function createGroup(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'color' => 'nullable|string',
        ]);
        
        try {
            $group = $this->permissionService->createPermissionGroup($request->all());
            
            return $this->success($group, 'Permission group created successfully', 201);
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get permissions by module
     */
    public function byModule($module): JsonResponse
    {
        try {
            $permissions = $this->permissionService->getPermissionsByModule($module);
            
            return $this->success($permissions, 'Module permissions retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get all modules
     */
    public function modules(): JsonResponse
    {
        try {
            $modules = $this->permissionService->getAllModules();
            
            return $this->success($modules, 'Modules retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Sync module permissions
     */
    public function syncModule(Request $request): JsonResponse
    {
        $request->validate([
            'module' => 'required|string|max:100',
            'permissions' => 'required|array',
            'permissions.*.name' => 'required|string',
            'permissions.*.display_name' => 'required|string',
            'permissions.*.description' => 'nullable|string',
            'permissions.*.group_id' => 'nullable|exists:permission_groups,id',
        ]);
        
        try {
            $result = $this->permissionService->syncModulePermissions(
                $request->module,
                $request->permissions
            );
            
            return $this->success($result, 'Module permissions synced successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
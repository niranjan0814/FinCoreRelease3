// routes/api.php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserPermissionController;
use App\Http\Controllers\Api\UserRoleController;

// Permission Management Routes
Route::prefix('permissions')->group(function () {
    Route::get('/', [PermissionController::class, 'index']);
    Route::get('/groups', [PermissionController::class, 'groups']);
    Route::get('/modules', [PermissionController::class, 'modules']);
    Route::get('/module/{module}', [PermissionController::class, 'byModule']);
    Route::post('/module/sync', [PermissionController::class, 'syncModule']);
    Route::post('/group', [PermissionController::class, 'createGroup']);
    Route::post('/', [PermissionController::class, 'store']);
    Route::get('/{permission}', [PermissionController::class, 'show']);
    Route::put('/{permission}', [PermissionController::class, 'update']);
    Route::delete('/{permission}', [PermissionController::class, 'destroy']);
});

// Role Management Routes
Route::prefix('roles')->group(function () {
    Route::get('/', [RoleController::class, 'index']);
    Route::get('/system', [RoleController::class, 'systemRoles']);
    Route::get('/level/{level}', [RoleController::class, 'byLevel']);
    Route::get('/default', [RoleController::class, 'defaultRole']);
    Route::post('/', [RoleController::class, 'store']);
    Route::get('/{role}', [RoleController::class, 'show']);
    Route::put('/{role}', [RoleController::class, 'update']);
    Route::delete('/{role}', [RoleController::class, 'destroy']);
    Route::post('/{role}/permissions/sync', [RoleController::class, 'syncPermissions']);
    Route::post('/{role}/permissions/assign', [RoleController::class, 'assignPermissions']);
    Route::post('/{role}/permissions/remove', [RoleController::class, 'removePermissions']);
});

// User Permission Management Routes
Route::prefix('users/{user}/permissions')->group(function () {
    Route::get('/', [UserPermissionController::class, 'show']);
    Route::get('/breakdown', [UserPermissionController::class, 'breakdown']);
    Route::post('/assign', [UserPermissionController::class, 'assignPermission']);
    Route::post('/remove', [UserPermissionController::class, 'removePermission']);
    Route::post('/sync', [UserPermissionController::class, 'syncPermissions']);
    Route::post('/check', [UserPermissionController::class, 'hasPermission']);
});

// User Role Management Routes
Route::prefix('users/{user}/roles')->group(function () {
    Route::get('/', [UserRoleController::class, 'getUserRoles']);
    Route::post('/assign', [UserRoleController::class, 'assignRole']);
    Route::post('/remove', [UserRoleController::class, 'removeRole']);
    Route::post('/sync', [UserRoleController::class, 'syncRoles']);
});

// Utility routes for frontend
Route::prefix('auth')->group(function () {
    Route::get('/me/permissions', function () {
        $user = auth()->user();
        
        return response()->json([
            'success' => true,
            'data' => [
                'permissions' => $user->getAllPermissionsFlattened(),
                'roles' => $user->getRoleNamesFlattened(),
                'direct_permissions' => $user->getDirectPermissionNames(),
                'is_super_admin' => $user->isSuperAdmin(),
                'is_admin' => $user->isAdmin(),
            ]
        ]);
    })->middleware('auth:sanctum');
});
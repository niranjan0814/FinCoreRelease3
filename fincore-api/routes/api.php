// routes/api.php - Add these routes
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;

// Public routes (no authentication required)
// routes/api.php - Update auth routes
Route::prefix('auth')->group(function () {
    // Public routes
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    
    // Protected routes
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::get('permissions', [AuthController::class, 'permissions']);
        Route::post('check-permission', [AuthController::class, 'checkPermission']);
        Route::post('check-any-permission', [AuthController::class, 'checkAnyPermission']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });
});

// Protected routes (authentication required)
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::get('permissions', [AuthController::class, 'permissions']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });

    // User Management (require specific permissions)
    // routes/api.php - Update user routes section
Route::prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index'])->middleware('permission:users.view');
    Route::post('/', [UserController::class, 'store'])->middleware('permission:users.create');
    Route::get('/{user}', [UserController::class, 'show'])->middleware('permission:users.view');
    Route::put('/{user}', [UserController::class, 'update'])->middleware('permission:users.edit');
    Route::delete('/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete');
    
    // Additional user endpoints
    Route::post('/{user}/change-password', [UserController::class, 'changePassword'])->middleware('permission:users.edit');
    Route::put('/{user}/status', [UserController::class, 'updateStatus'])->middleware('permission:users.edit');
    Route::post('/{user}/unlock', [UserController::class, 'unlock'])->middleware('permission:users.edit');
    Route::get('/{user}/statistics', [UserController::class, 'getStatistics'])->middleware('permission:users.view');
    Route::get('/{user}/activity-log', [UserController::class, 'getActivityLog'])->middleware('permission:users.view');
    
    // Bulk operations
    Route::post('/bulk/status', [UserController::class, 'bulkUpdateStatus'])->middleware('permission:users.edit');
});

    // Permission Management
    Route::prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index'])->middleware('permission:permissions.view');
        Route::post('/', [PermissionController::class, 'store'])->middleware('permission:permissions.create');
        Route::get('/{permission}', [PermissionController::class, 'show'])->middleware('permission:permissions.view');
        Route::put('/{permission}', [PermissionController::class, 'update'])->middleware('permission:permissions.edit');
        Route::delete('/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:permissions.delete');
    });

    // Role Management
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->middleware('permission:roles.view');
        Route::post('/', [RoleController::class, 'store'])->middleware('permission:roles.create');
        Route::get('/{role}', [RoleController::class, 'show'])->middleware('permission:roles.view');
        Route::put('/{role}', [RoleController::class, 'update'])->middleware('permission:roles.edit');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete');
    });
});
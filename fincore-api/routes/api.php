
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\CenterController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\LoanProductController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\InvestmentProductController;
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


Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);

    // Branch Management
    Route::prefix('branches')->group(function () {
        Route::get('/all', [BranchController::class, 'all']); // Public for authenticated users (dropdowns)
        Route::get('/', [BranchController::class, 'index'])->middleware('permission:branches.view');
        Route::post('/', [BranchController::class, 'store'])->middleware('permission:branches.create');
        Route::get('/{id}', [BranchController::class, 'show'])->middleware('permission:branches.view');
        Route::put('/{id}', [BranchController::class, 'update'])->middleware('permission:branches.edit');
        Route::delete('/{id}', [BranchController::class, 'destroy'])->middleware('permission:branches.delete');
    });

    // Loans
    Route::get('/loans', [LoanController::class, 'index'])->name('loans.index');
    Route::post('/loans', [LoanController::class, 'store'])->name('loans.store');
    Route::get('/loans/{id}', [LoanController::class, 'show'])->name('loans.show');
    Route::patch('/loans/{id}/approve', [LoanController::class, 'approve'])->name('loans.approve');

    // Loan Product Management
    Route::prefix('loan-products')->group(function () {
        Route::get('/', [LoanProductController::class, 'index'])->middleware('permission:loan_products.view');
        Route::get('/filter', [LoanProductController::class, 'filter'])->middleware('permission:loan_products.view');
        Route::post('/', [LoanProductController::class, 'store'])->middleware('permission:loan_products.create');
        Route::get('/{id}', [LoanProductController::class, 'show'])->middleware('permission:loan_products.view');
        Route::patch('/{id}/approve', [LoanProductController::class, 'approve'])->middleware('permission:loan_products.edit');
        Route::get('/customer/{customer_id}', [LoanProductController::class, 'getByCustomerId'])->middleware('permission:loan_products.view');
        Route::put('/{id}', [LoanProductController::class, 'update'])->middleware('permission:loan_products.edit');
        Route::delete('/{id}', [LoanProductController::class, 'destroy'])->middleware('permission:loan_products.delete');
    });

    // Investment Product Management
    Route::prefix('investment-products')->group(function () {
        Route::get('/', [InvestmentProductController::class, 'index'])->middleware('permission:investment_products.view');
        Route::get('/filter', [InvestmentProductController::class, 'filter'])->middleware('permission:investment_products.view');
        Route::post('/', [InvestmentProductController::class, 'store'])->middleware('permission:investment_products.create');
        Route::get('/{id}', [InvestmentProductController::class, 'show'])->middleware('permission:investment_products.view');
        Route::put('/{id}', [InvestmentProductController::class, 'update'])->middleware('permission:investment_products.edit');
        Route::delete('/{id}', [InvestmentProductController::class, 'destroy'])->middleware('permission:investment_products.delete');
    });

    // Center Management
    Route::prefix('centers')->group(function () {
        Route::get('/', [CenterController::class, 'index'])->middleware('permission:centers.view');
        Route::get('/pending', [CenterController::class, 'pending'])->middleware('permission:centers.view');
        Route::post('/', [CenterController::class, 'store'])->middleware('permission:centers.create');
        Route::get('/{id}', [CenterController::class, 'show'])->middleware('permission:centers.view');
        Route::put('/{id}', [CenterController::class, 'update'])->middleware('permission:centers.edit');
        Route::patch('/{id}/approve', [CenterController::class, 'approve'])->middleware('permission:centers.approve');
        Route::delete('/{id}', [CenterController::class, 'destroy'])->middleware('permission:centers.delete');
    });

    // Group Management
    Route::prefix('groups')->group(function () {
        Route::get('/', [GroupController::class, 'index'])->middleware('permission:groups.view');
        Route::post('/', [GroupController::class, 'store'])->middleware('permission:groups.create');
        Route::get('/{id}', [GroupController::class, 'show'])->middleware('permission:groups.view');
        Route::put('/{id}', [GroupController::class, 'update'])->middleware('permission:groups.edit');
        Route::delete('/{id}', [GroupController::class, 'destroy'])->middleware('permission:groups.delete');
    });

    // Admin Management
    Route::prefix('admins')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\AdminController::class, 'index'])->middleware('permission:admins.view');
        Route::post('/', [\App\Http\Controllers\Api\AdminController::class, 'store'])->middleware('permission:admins.create');
        Route::get('/{id}', [\App\Http\Controllers\Api\AdminController::class, 'show'])->middleware('permission:admins.view');
        Route::put('/{id}', [\App\Http\Controllers\Api\AdminController::class, 'update'])->middleware('permission:admins.edit');
        Route::delete('/{id}', [\App\Http\Controllers\Api\AdminController::class, 'destroy'])->middleware('permission:admins.delete');
    });

    // Staff Management
    Route::prefix('staffs')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\StaffController::class, 'index'])->middleware('permission:staff.view');
        Route::get('/by-role/{role}', [\App\Http\Controllers\Api\StaffController::class, 'byRole']); // Dropdown helper
        Route::post('/', [\App\Http\Controllers\Api\StaffController::class, 'store'])->middleware('permission:staff.create');
        Route::get('/{staff_id}', [\App\Http\Controllers\Api\StaffController::class, 'show'])->middleware('permission:staff.view');
        Route::put('/{staff_id}', [\App\Http\Controllers\Api\StaffController::class, 'update'])->middleware('permission:staff.edit');
        Route::delete('/{staff_id}', [\App\Http\Controllers\Api\StaffController::class, 'destroy'])->middleware('permission:staff.delete');
    });

    // Customer Management
    Route::prefix('customers')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\CustomerController::class, 'index'])->middleware('permission:customers.view');
        Route::post('/', [\App\Http\Controllers\Api\CustomerController::class, 'store'])->middleware('permission:customers.create');
        Route::get('/constants', [\App\Http\Controllers\Api\CustomerController::class, 'getConstants']); // Public for authenticated users
        Route::get('/{id}', [\App\Http\Controllers\Api\CustomerController::class, 'show'])->middleware('permission:customers.view');
        Route::put('/{id}', [\App\Http\Controllers\Api\CustomerController::class, 'update'])->middleware('permission:customers.edit');
        Route::delete('/{id}', [\App\Http\Controllers\Api\CustomerController::class, 'destroy'])->middleware('permission:customers.delete');
        
        // Additional customer endpoints
        Route::post('/import', [\App\Http\Controllers\Api\CustomerController::class, 'import'])->middleware('permission:customers.import');
        Route::get('/export', [\App\Http\Controllers\Api\CustomerController::class, 'export'])->middleware('permission:customers.export');
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
        Route::get('/groups', [PermissionController::class, 'groups']);
        Route::get('/', [PermissionController::class, 'index'])->middleware('permission:permissions.view');
        Route::post('/', [PermissionController::class, 'store'])->middleware('permission:permissions.create');
        Route::get('/{permission}', [PermissionController::class, 'show'])->middleware('permission:permissions.view');
        Route::put('/{permission}', [PermissionController::class, 'update'])->middleware('permission:permissions.edit');
        Route::delete('/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:permissions.delete');
    });

    Route::get('/permission-groups', [PermissionController::class, 'groups']);

    // Role Management
    Route::prefix('roles')->group(function () {
        Route::get('/all', [RoleController::class, 'all']);
        Route::get('/', [RoleController::class, 'index'])->middleware('permission:roles.view');
        Route::post('/', [RoleController::class, 'store'])->middleware('permission:roles.create');
        Route::get('/{role}', [RoleController::class, 'show'])->middleware('permission:roles.view');
        Route::put('/{role}', [RoleController::class, 'update'])->middleware('permission:roles.edit');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete');
    });
});

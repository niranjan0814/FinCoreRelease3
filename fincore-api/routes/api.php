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
use App\Http\Controllers\Api\StaffSessionController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CenterChangeRequestController;
use App\Http\Controllers\Api\ShareholderController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==================== PUBLIC ROUTES ====================
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
});

Route::post('/login', [AuthController::class, 'login']); // Keep legacy top-level login if needed


// ==================== PROTECTED ROUTES (AUTH ONLY) ====================
// These routes require a token but NOT necessarily an active work session
// (e.g., Auth management, Session management, Profile)
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Core Auth Details
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::get('permissions', [AuthController::class, 'permissions']);
        Route::post('check-permission', [AuthController::class, 'checkPermission']);
        Route::post('check-any-permission', [AuthController::class, 'checkAnyPermission']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });

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
        Route::get('/{id}/transfer-eligibility', [\App\Http\Controllers\Api\CustomerController::class, 'checkTransferEligibility'])->middleware('permission:customers.view');
        Route::put('/{id}', [\App\Http\Controllers\Api\CustomerController::class, 'update'])->middleware('permission:customers.edit');
        Route::delete('/{id}', [\App\Http\Controllers\Api\CustomerController::class, 'destroy'])->middleware('permission:customers.delete');
    });

    // Staff Session & Attendance Management
    // (Must be accessible to START or RESUME a session)
    Route::prefix('sessions')->group(function () {
        Route::get('/current', [StaffSessionController::class, 'getCurrentSession']);
        Route::post('/end', [StaffSessionController::class, 'endSession']);
        Route::post('/resume', [StaffSessionController::class, 'resumeSession']);
        Route::get('/today', [StaffSessionController::class, 'getTodaySessions']);
        Route::get('/by-date', [StaffSessionController::class, 'getSessionsByDate']);
        Route::get('/midnight-warning', [StaffSessionController::class, 'checkMidnightWarning']);
        Route::post('/midnight-timeout', [StaffSessionController::class, 'midnightTimeout']);
        
        // Attendance & Management
        Route::get('/attendance-summary', [StaffSessionController::class, 'getAttendanceSummary']);
        Route::get('/pending-attendance', [StaffSessionController::class, 'getPendingAttendance']);
        Route::post('/{sessionId}/approve', [StaffSessionController::class, 'approveAttendance']);
        Route::post('/{sessionId}/reject', [StaffSessionController::class, 'rejectAttendance']);
        Route::get('/user/{userId}', [StaffSessionController::class, 'getUserSessions']);
        Route::post('/user/{userId}/unlock', [StaffSessionController::class, 'unlockUserAccount']);
        Route::post('/user/{userId}/lock', [StaffSessionController::class, 'lockUserAccount']);
        Route::get('/attendance-report', [StaffSessionController::class, 'getAttendanceReport']);
    });

    // ==================== PROTECTED ROUTES (AUTH + ACTIVE SESSION) ====================
    // These routes require both a valid JWT AND an active work session (for Non-Admins)
    Route::middleware(['active_session'])->group(function () {

        // Branch Management
        Route::prefix('branches')->group(function () {
            Route::get('/all', [BranchController::class, 'all']); 
            Route::get('/', [BranchController::class, 'index'])->middleware('permission:branches.view');
            Route::post('/', [BranchController::class, 'store'])->middleware('permission:branches.create');
            Route::get('/{id}', [BranchController::class, 'show'])->middleware('permission:branches.view');
            Route::put('/{id}', [BranchController::class, 'update'])->middleware('permission:branches.edit');
            Route::delete('/{id}', [BranchController::class, 'destroy'])->middleware('permission:branches.delete');
        });

        // Loan Product Management
        Route::prefix('loan-products')->group(function () {
            Route::get('/', [LoanProductController::class, 'index'])->middleware('permission:loan_products.view');
            Route::get('/filter', [LoanProductController::class, 'filter'])->middleware('permission:loan_products.view');
            Route::post('/', [LoanProductController::class, 'store'])->middleware('permission:loan_products.create');
            Route::get('/{id}', [LoanProductController::class, 'show'])->middleware('permission:loan_products.view');
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
            Route::post('/{id}/reject', [CenterController::class, 'reject'])->middleware('permission:centers.approve');
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
            Route::get('/', [AdminController::class, 'index'])->middleware('permission:admins.view');
            Route::post('/', [AdminController::class, 'store'])->middleware('permission:admins.create');
            Route::get('/{id}', [AdminController::class, 'show'])->middleware('permission:admins.view');
            Route::put('/{id}', [AdminController::class, 'update'])->middleware('permission:admins.edit');
            Route::delete('/{id}', [AdminController::class, 'destroy'])->middleware('permission:admins.delete');
        });

        // Staff Management
        Route::prefix('staffs')->group(function () {
            Route::get('/list', [StaffController::class, 'list']); // New dropdown endpoint
            Route::get('/', [StaffController::class, 'index'])->middleware('permission:staff.view');
            Route::get('/by-role/{role}', [StaffController::class, 'byRole']); 
            Route::post('/', [StaffController::class, 'store'])->middleware('permission:staff.create');
            Route::get('/{staff_id}', [StaffController::class, 'show'])->middleware('permission:staff.view');
            Route::put('/{staff_id}', [StaffController::class, 'update'])->middleware('permission:staff.edit');
            Route::delete('/{staff_id}', [StaffController::class, 'destroy'])->middleware('permission:staff.delete');
        });

        // Customer Management
        Route::prefix('customers')->group(function () {
            Route::get('/', [CustomerController::class, 'index'])->middleware('permission:customers.view');
            Route::post('/', [CustomerController::class, 'store'])->middleware('permission:customers.create');
            Route::get('/constants', [CustomerController::class, 'getConstants']); 
            Route::get('/{id}', [CustomerController::class, 'show'])->middleware('permission:customers.view');
            Route::put('/{id}', [CustomerController::class, 'update'])->middleware('permission:customers.edit');
            Route::delete('/{id}', [CustomerController::class, 'destroy'])->middleware('permission:customers.delete');
            Route::post('/import', [CustomerController::class, 'import'])->middleware('permission:customers.import');
            Route::get('/export', [CustomerController::class, 'export'])->middleware('permission:customers.export');
        });

        // Receipts
        Route::prefix('receipts')->group(function () {
            Route::post('/', [App\Http\Controllers\Api\ReceiptController::class, 'store']);
            Route::post('/{id}/cancel-request', [App\Http\Controllers\Api\ReceiptController::class, 'requestCancellation']);
            Route::post('/{id}/approve-cancel', [App\Http\Controllers\Api\ReceiptController::class, 'approveCancellation']);
        });

        // Complaints
        Route::apiResource('complaints', App\Http\Controllers\Api\ComplaintController::class);

        // Collections
        Route::get('/collections/due', [App\Http\Controllers\Api\CollectionController::class, 'getDuePayments'])->middleware('permission:collections.view');

        // Center Change Requests
        Route::prefix('center-requests')->group(function () {
            Route::get('/', [CenterChangeRequestController::class, 'index'])->middleware('permission:customers.approve_transfer');
            Route::post('/', [CenterChangeRequestController::class, 'store'])->middleware('permission:customers.edit');
            Route::patch('/{id}/approve', [CenterChangeRequestController::class, 'approve'])->middleware('permission:customers.approve_transfer');
            Route::patch('/{id}/reject', [CenterChangeRequestController::class, 'reject'])->middleware('permission:customers.approve_transfer');
        });

        // User Management
        Route::prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index'])->middleware('permission:users.view,staff.view');
            Route::post('/', [UserController::class, 'store'])->middleware('permission:users.create,staff.create');
            Route::get('/{user}', [UserController::class, 'show'])->middleware('permission:users.view,staff.view');
            Route::put('/{user}', [UserController::class, 'update'])->middleware('permission:users.edit,staff.edit');
            Route::delete('/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete,staff.delete');
            Route::post('/{user}/change-password', [UserController::class, 'changePassword'])->middleware('permission:users.edit,staff.edit');
            Route::put('/{user}/status', [UserController::class, 'updateStatus'])->middleware('permission:users.edit,staff.edit');
            Route::post('/{user}/unlock', [UserController::class, 'unlock'])->middleware('permission:users.unlock,staff.unlock');
            Route::post('/{user}/lock', [UserController::class, 'lock'])->middleware('permission:users.unlock,staff.unlock');
            Route::get('/{user}/statistics', [UserController::class, 'getStatistics'])->middleware('permission:users.view,staff.view');
            Route::get('/{user}/activity-log', [UserController::class, 'getActivityLog'])->middleware('permission:users.view,staff.view');
            Route::post('/bulk/status', [UserController::class, 'bulkUpdateStatus'])->middleware('permission:users.edit,staff.edit');
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

        // Shareholders
        Route::apiResource('shareholders', ShareholderController::class);
    });
});
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Services\StaffSessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends BaseController
{
    protected StaffSessionService $sessionService;

    public function __construct(StaffSessionService $sessionService)
    {
        $this->sessionService = $sessionService;
        $this->middleware('auth:sanctum', [
            'except' => ['login']
        ]);
    }

    /**
     * Login using username OR email
     * Lock account after 3 failed attempts
     * Creates a staff session on successful login
     */
    public function login(Request $request)
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        try {
            // Find by username OR email
            $user = User::where('user_name', $request->login)
                ->orWhere('email', $request->login)
                ->first();

            if (!$user) {
                return $this->errorResponse(4010, 'Invalid username or password', 401);
            }

            // Check if account is locked (locked_until not expired or manually deactivated)
            // Check 1: Admin Ban (is_active = false)
            if (!$user->is_active) {
                return $this->errorResponse(
                    4230,
                    'Account disabled. Please contact administrator.', // Cannot be reset by user
                    423
                );
            }

            // Check 2: System Lockout (Failed Attempts >= 3)
            if ($user->failed_login_attempts >= 3) {
                 return $this->errorResponse(
                    4230,
                    'Account disabled details. Please reset your Account.', // Can be reset by user
                    423
                );
            }

            // Check 3: Time-based Lock (if any)
            if ($user->locked_until && $user->locked_until->isFuture()) {
                return $this->errorResponse(
                    4230,
                    'Account is locked until ' . $user->locked_until->format('Y-m-d H:i:s') . '. Please contact administrator to unlock.',
                    423
                );
            }

            // Password validation
            if (!Hash::check($request->password, $user->password)) {
                $user->recordFailedLogin();
                $user->refresh(); // Reload to check if it got locked

                if ($user->failed_login_attempts >= 3) {
                    // Send password reset email automatically
                    // We suppress errors here to avoid leaking info or crashing if mail fails, 
                    // though for this req we assume it works.
                    try {
                        \Illuminate\Support\Facades\Password::broker()->sendResetLink(['email' => $user->email]);
                    } catch (\Exception $e) {
                        Log::error('Failed to send lockout reset email: ' . $e->getMessage());
                    }

                    return $this->errorResponse(
                        4230,
                        'Account disabled details. Please reset your Account.',
                        423
                    );
                }

                return $this->errorResponse(
                    4010,
                    'Invalid credentials. You have only ' . (3 - $user->failed_login_attempts) . ' attempt(s) left',
                    401
                );
            }
             // Successful login - reset failed attempts and unlock
            $user->update([
                'failed_login_attempts' => 0,
                'locked_until' => null, // Clear any time-based lock
            ]);
            // Successful login - reset failed attempts, unlock, and record timestamp
            $user->recordLogin($request->ip());

            // Create auth token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Start or resume staff session
            $staffSession = $this->sessionService->resumeSession(
                $user,
                $request->ip(),
                $request->userAgent()
            );

            // Load roles and permissions
            $user->load(['roles.permissions', 'permissions']);

            // Get role and permission data
            $roles = $user->roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'description' => $role->description,
                    'level' => $role->level,
                    'hierarchy' => $role->hierarchy,
                ];
            });

            $permissions = $user->getAllPermissions()->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'display_name' => $permission->display_name,
                    'module' => $permission->module,
                ];
            });

            return response()->json([
                'statusCode' => 2000,
                'message' => 'Login successful',
                'data' => [
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'user' => $user,
                    'roles' => $roles,
                    'permissions' => $permissions,
                    'session' => [
                        'id' => $staffSession->id,
                        'date' => $staffSession->date->toDateString(),
                        'login_at' => $staffSession->login_at->toIso8601String(),
                        'status' => $staffSession->status,
                    ],
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Login failed', [
                'login' => $request->login,
                'ip' => $request->ip(),
                'error' => $e->getMessage()
            ]);

            return $this->errorResponse(5000, 'Authentication failed', 500);
        }
    }

    /**
     * Get authenticated user profile
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return $this->errorResponse(4010, 'Session expired. Please login again', 401);
        }

        // Load roles and permissions
        $user->load(['roles.permissions', 'permissions']);

        // Get role and permission data
        $roles = $user->roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'display_name' => $role->display_name,
                'description' => $role->description,
                'level' => $role->level,
                'hierarchy' => $role->hierarchy,
            ];
        });

        $permissions = $user->getAllPermissions()->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
                'display_name' => $permission->display_name,
                'module' => $permission->module,
            ];
        });

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Profile fetched successfully',
            'data' => [
                'user' => $user,
                'roles' => $roles,
                'permissions' => $permissions,
            ]
        ], 200);
    }

    /**
     * Logout (revoke token)
     * Supports different logout types:
     * - LOGOUT: End work for the day (locks account until next day)
     * - ON_WORK: Temporary logout (field work, meeting) - session remains active
     * - STAY_IN_OFFICE: User idle but still working - session remains active
     */
    public function logout(Request $request)
    {
        $request->validate([
            'logout_type' => 'nullable|in:LOGOUT,ON_WORK,STAY_IN_OFFICE',
            'remarks' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        if (!$user) {
            return $this->errorResponse(4010, 'Session expired. Please login again', 401);
        }

        $logoutType = $request->logout_type ?? 'LOGOUT';
        
        // End the staff session
        $session = $this->sessionService->endSession(
            $user,
            $logoutType,
            $request->remarks
        );

        // Always revoke the auth token for both permanent and temporary logout
        $user->currentAccessToken()->delete();
        
        if ($logoutType === 'LOGOUT') {
            return response()->json([
                'statusCode' => 2000,
                'message' => 'You have been logged out for the day. Your account is locked until tomorrow.',
                'data' => [
                    'session' => $session ? [
                        'id' => $session->id,
                        'logout_at' => $session->logout_at?->toIso8601String(),
                        'worked_minutes' => $session->worked_minutes,
                        'worked_hours' => round($session->worked_minutes / 60, 2),
                    ] : null,
                    'locked_until' => $user->fresh()->locked_until?->toIso8601String(),
                ]
            ], 200);
        }

        // For temporary logouts (ON_WORK, STAY_IN_OFFICE), keep the auth token
        $message = match ($logoutType) {
            'ON_WORK' => 'Temporary logout recorded. You can resume your session when you return.',
            'STAY_IN_OFFICE' => 'Idle status recorded. Your session remains active.',
            default => 'Logout successful',
        };

        return response()->json([
            'statusCode' => 2000,
            'message' => $message,
            'data' => [
                'session' => $session ? [
                    'id' => $session->id,
                    'logout_at' => $session->logout_at?->toIso8601String(),
                    'logout_type' => $session->logout_type,
                    'status' => $session->status,
                ] : null,
            ]
        ], 200);
    }

    /**
     * Check single permission
     */
    public function checkPermission(Request $request)
    {
        $request->validate([
            'permission' => 'required|string'
        ]);

        $user = Auth::user();

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Permission checked',
            'data' => [
                'permission' => $request->permission,
                'has_permission' => $user->hasPermissionTo($request->permission),
            ]
        ]);
    }

    /**
     * Check multiple permissions
     */
    public function checkAnyPermission(Request $request)
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string'
        ]);

        $user = Auth::user();

        $matched = collect($request->permissions)
            ->filter(fn ($p) => $user->hasPermissionTo($p))
            ->values();

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Permissions checked',
            'data' => [
                'has_any_permission' => $matched->isNotEmpty(),
                'matched_permissions' => $matched,
            ]
        ]);
    }

    /**
     * Unified error response helper
     */
    private function errorResponse(int $code, string $message, int $httpCode)
    {
        return response()->json([
            'statusCode' => $code,
            'message' => $message,
        ], $httpCode);
    }
}

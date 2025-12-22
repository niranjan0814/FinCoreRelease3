<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends BaseController
{
    /**
     * Create a new AuthController instance.
     */
    public function __construct()
    {
        $this->middleware('auth:sanctum', ['except' => ['login', 'register']]);
    }

    /**
     * Login user and create token
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $credentials = $request->only('email', 'password');

            // Check if user exists
            $user = User::where('email', $credentials['email'])->first();

            if (!$user) {
                return $this->error('Invalid credentials', 401);
            }

            // Check if account is active
            if (!$user->is_active) {
                return $this->error('Account is inactive. Please contact administrator.', 403);
            }

            // Check if account is locked
            if ($user->is_locked) {
                return $this->error('Account is locked. Please try again later or contact administrator.', 423);
            }

            // Attempt to authenticate
            if (!Auth::attempt($credentials)) {
                // Record failed login attempt
                $user->recordFailedLogin();
                
                $attemptsLeft = 5 - $user->failed_login_attempts;
                
                return $this->error('Invalid credentials', 401, [
                    'attempts_left' => max(0, $attemptsLeft),
                    'locked' => $user->is_locked
                ]);
            }

            // Record successful login
            $user->recordLogin($request->ip());

            // Create token - FIXED: Use the correct method
            $token = $user->createToken('auth_token')->plainTextToken;

            // Set current token for user instance
            $user->withAccessToken($user->tokens()->where('name', 'auth_token')->latest()->first());

            return $this->respondWithToken($token, $user);

        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage(), [
                'email' => $request->email,
                'ip' => $request->ip()
            ]);
            
            return $this->serverError('Authentication failed');
        }
    }

    /**
     * Register a new user
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            
            // Hash password
            $data['password'] = Hash::make($data['password']);
            $data['is_active'] = true;
            
            // Create user
            $user = User::create($data);
            
            // Assign default role (staff)
            $user->assignRole('staff');
            
            // Create staff details
            if ($request->has('staff_details')) {
                $user->staffDetail()->create($request->staff_details);
            }

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Set current token
            $user->withAccessToken($user->tokens()->where('name', 'auth_token')->latest()->first());

            // Log activity
            activity()
                ->causedBy($user)
                ->log('User registered');

            return $this->respondWithToken($token, $user, 'User registered successfully', 201);

        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            return $this->serverError('Registration failed');
        }
    }

    /**
     * Get authenticated user
     */
    public function me(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Load relationships properly
            $user->load(['roles.permissions', 'permissions', 'staffDetail']);
            
            return $this->success([
                'user' => $user,
                'permissions' => $user->getAllPermissionNames(),
                'roles' => $user->getRoleNamesArray(),
                'direct_permissions' => $user->getDirectPermissionNames(),
                'is_super_admin' => $user->isSuperAdmin(),
                'is_admin' => $user->isAdmin(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get user error: ' . $e->getMessage());
            return $this->serverError('Failed to get user data');
        }
    }

    /**
     * Logout user (Revoke token)
     */
    public function logout(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Revoke current token - FIXED
            $user->currentAccessToken()->delete();
            
            return $this->success(null, 'Successfully logged out');
            
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return $this->serverError('Logout failed');
        }
    }

    /**
     * Refresh token
     */
    public function refresh(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Delete current token - FIXED
            $user->currentAccessToken()->delete();
            
            // Create new token
            $newToken = $user->createToken('auth_token')->plainTextToken;
            
            // Set new token
            $user->withAccessToken($user->tokens()->where('name', 'auth_token')->latest()->first());
            
            return $this->success([
                'access_token' => $newToken,
                'token_type' => 'bearer',
            ], 'Token refreshed');
            
        } catch (\Exception $e) {
            Log::error('Token refresh error: ' . $e->getMessage());
            return $this->error('Unable to refresh token', 401);
        }
    }

    /**
     * Get user permissions
     */
    public function permissions(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            return $this->success([
                'permissions' => $user->getAllPermissionNames(),
                'roles' => $user->getRoleNamesArray(),
                'direct_permissions' => $user->getDirectPermissionNames(),
                'permissions_by_module' => $user->getPermissionsByModule(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get permissions error: ' . $e->getMessage());
            return $this->serverError('Failed to get permissions');
        }
    }

    /**
     * Format token response
     */
    protected function respondWithToken($token, $user, $message = 'Login successful', $code = 200): JsonResponse
    {
        // Load necessary relationships
        $user->load(['roles', 'staffDetail']);
        
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'access_token' => $token,
                'token_type' => 'bearer',
                'user' => $user,
                'permissions' => $user->getAllPermissionNames(),
                'roles' => $user->getRoleNamesArray(),
                'direct_permissions' => $user->getDirectPermissionNames(),
            ]
        ], $code);
    }

    /**
     * Check if user has permission
     */
    public function checkPermission(Request $request): JsonResponse
    {
        $request->validate([
            'permission' => 'required|string'
        ]);

        try {
            $user = Auth::user();
            $hasPermission = $user->hasPermission($request->permission);
            
            return $this->success([
                'has_permission' => $hasPermission,
                'permission' => $request->permission,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Check permission error: ' . $e->getMessage());
            return $this->serverError('Failed to check permission');
        }
    }

    /**
     * Check if user has any of the given permissions
     */
    public function checkAnyPermission(Request $request): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string'
        ]);

        try {
            $user = Auth::user();
            $hasAnyPermission = $user->hasAnyPermission($request->permissions);
            
            return $this->success([
                'has_any_permission' => $hasAnyPermission,
                'permissions' => $request->permissions,
                'matched_permissions' => $hasAnyPermission ? array_filter($request->permissions, function($perm) use ($user) {
                    return $user->hasPermission($perm);
                }) : [],
            ]);
            
        } catch (\Exception $e) {
            Log::error('Check any permission error: ' . $e->getMessage());
            return $this->serverError('Failed to check permissions');
        }
    }
}
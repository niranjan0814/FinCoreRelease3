<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    /**
     * Create a new Admin user (Super Admin only).
     */
    public function store(Request $request)
    {
        // Check hierarchy: creator must be strictly above the 'admin' role
        $currentUser = auth()->user();
        if ($currentUser) {
            $adminRole = \App\Models\Role::where('name', 'admin')->first();
            if ($adminRole && $currentUser->getRoleHierarchy() >= $adminRole->hierarchy) {
                return response()->json([
                    'statusCode' => 4030,
                    'message' => 'Unauthorized: You cannot create a role at your level or above.'
                ], 403);
            }
        }

        // Manual validation to return custom 4000 code
        $validator = Validator::make($request->all(), [
            'email' => 'required|email:filter',
            'password' => ['required', 'string', 'min:8', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'regex:/[@$!%*#?&]/'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'statusCode' => 4000,
                'message' => 'Required fields are missing',
                'errors' => $validator->errors()
            ], 400);
        }

        // Check for conflict (4090)
        if (User::where('email', $request->email)->exists()) {
            return response()->json([
                'statusCode' => 4090,
                'message' => 'Admin already exists'
            ], 409);
        }

        // Auto-generate User Name (AD + 4 digits)
        $latestAdmin = User::where('user_name', 'LIKE', 'AD%')
                           ->orderByRaw('LENGTH(user_name) DESC') // Ensure standard length sorting
                           ->orderBy('user_name', 'desc')
                           ->first();

        if ($latestAdmin) {
            // Extract the number part (assuming ADxxxx format)
            $lastNumber = intval(substr($latestAdmin->user_name, 2));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        // Format: AD0001, AD0002, ...
        $newUserName = 'AD' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);

        $admin = User::create([
            'user_name' => $newUserName,
            'email' => $request->email,
            'password' => $request->password, // Casts to hashed in Model
            'digital_signature' => Hash::make($newUserName), // Auto-generated from user_name
            'is_active' => true,
        ]);

        // Assign admin role using Spatie
        $admin->assignRole('admin');

        // Load roles and permissions
        $admin->load(['roles.permissions', 'permissions']);

        return response()->json([
            'statusCode' => 2010,
            'message' => 'Admin created successfully',
            'data' => $admin
        ], 201);
    }

    /**
     * List all admins.
     */
    public function index()
    {
        $admins = User::role('admin')
            ->with(['roles.permissions', 'permissions', 'staff.branch'])
            ->get();
            
        return response()->json([
            'statusCode' => 2000,
            'message' => 'Admin list fetched successfully',
            'data' => $admins
        ], 200);
    }

    /**
     * Get Admin By Id.
     */
    public function show($id)
    {
        $admin = User::role('admin')
            ->with(['roles.permissions', 'permissions', 'staff.branch'])
            ->find($id);

        if (!$admin) {
            return response()->json([
                'statusCode' => 4040,
                'message' => 'Admin not found'
            ], 404);
        }

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Admin details fetched successfully',
            'data' => $admin
        ], 200);
    }

    /**
     * Update Admin details.
     */
    public function update(Request $request, $id)
    {
        $user = User::role('admin')->find($id);

        if (!$user) {
            return response()->json([
                'statusCode' => 4040,
                'message' => 'Admin not found' // Reusing 4040 from show spec as it's appropriate
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'email' => [
                'nullable',
                'email:filter',
                Rule::unique('users', 'email')->ignore($user->id)
            ],
            'password' => ['nullable', 'string', 'min:8', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'regex:/[@$!%*#?&]/'],
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'statusCode' => 4000,
                'message' => 'Invalid admin data',
                'errors' => $validator->errors()
            ], 400);
        }

        // Update email if provided
        if ($request->has('email')) {
            $user->email = $request->email;
        }

        // Update password if provided
        if ($request->has('password')) {
            $user->password = $request->password;
        }

        // Update status if provided
        if ($request->has('is_active')) {
            $user->is_active = $request->is_active;
            // Reset failed attempts if reactivating
            if ($user->is_active) {
                $user->failed_login_attempts = 0;
            }
        }

        $user->save();

        // Load roles and permissions
        $user->load(['roles.permissions', 'permissions']);

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Admin updated successfully',
            'data' => $user
        ], 200);
    }

    /**
     * Delete Admin.
     */
    public function destroy($id)
    {
        $user = User::role('admin')->find($id);

        if (!$user) {
            return response()->json([
                'statusCode' => 4040,
                'message' => 'Admin not found'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Admin deleted successfully'
        ], 200);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StaffController extends Controller
{
    /**
     * Create a new Staff (Admin only).
     */
    public function store(Request $request)
    {
        // 1. Check if Staff already exists (Email or NIC)
        // We check this manually to return the specific 4090 code
        if (Staff::where('email_id', $request->email_id)
                 ->orWhere('nic', $request->nic)
                 ->exists()) {
            return response()->json([
                'statusCode' => 4090,
                'message' => 'Staff already exists'
            ], 409);
        }

        // Custom validation to return 4000 for other issues
        $validator = Validator::make($request->all(), [
            'email_id' => 'required|email:filter',
            'account_status' => 'required|string',
            'contact_no' => 'required|string',
            'full_name' => 'required|string',
            'name_with_initial' => 'required|string',
            'address' => 'required|string',
            'nic' => ['required', 'string', 'regex:/^([0-9]{9}[x|X|v|V]|[0-9]{12})$/'],
            'work_info' => 'required',
            'age' => 'required|integer|min:18|max:80',
            'profile_image' => 'required|string',
            'gender' => 'required|string',
            'role_name' => 'nullable|string|exists:roles,name', // Changed from 'role' to 'role_name' and validate against roles table
            'basic_salary' => 'nullable|numeric|min:0',
            'monthly_target_amount' => 'nullable|numeric|min:0',
            'monthly_target_count' => 'nullable|integer|min:0',
            'branch_id' => 'nullable|exists:branches,id',
            'center_id' => 'nullable|exists:centers,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'statusCode' => 4000,
                'message' => 'Staff details are incomplete',
                'errors' => $validator->errors()
            ], 400);
        }

        // Auto-generate Staff ID (ST + 4 digits)
        $latestStaff = Staff::where('staff_id', 'LIKE', 'ST%')
                           ->orderByRaw('LENGTH(staff_id) DESC')
                           ->orderBy('staff_id', 'desc')
                           ->first();

        if ($latestStaff) {
            $lastNumber = intval(substr($latestStaff->staff_id, 2));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        // Format: ST0001, ST0002, ...
        $newStaffId = 'ST' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);

        // Use transaction to ensure both tables are updated together
        DB::beginTransaction();
        try {
            // Create staff record
            $staff = Staff::create([
                'staff_id' => $newStaffId,
                'email_id' => $request->email_id,
                'account_status' => $request->account_status,
                'contact_no' => $request->contact_no,
                'full_name' => $request->full_name,
                'name_with_initial' => $request->name_with_initial,
                'address' => $request->address,
                'nic' => $request->nic,
                'work_info' => $request->work_info,
                'age' => $request->age,
                'profile_image' => $request->profile_image,
                'gender' => $request->gender,
                'basic_salary' => $request->basic_salary,
                'monthly_target_amount' => $request->monthly_target_amount,
                'monthly_target_count' => $request->monthly_target_count,
                'branch_id' => $request->branch_id,
                'center_id' => $request->center_id,
            ]);

            // Create corresponding user record
            $user = User::create([
                'user_name' => $newStaffId, // staff_id becomes user_name
                'email' => $request->email_id, // email_id becomes email
                'password' => $request->nic, // NIC as default password
                'digital_signature' => Hash::make($newStaffId),
                'is_active' => true,
            ]);

            // Assign role using Spatie (default to 'staff' if not provided)
            $roleName = $request->role_name ?? 'staff';
            $user->assignRole($roleName);

            // Load roles and permissions for response
            $user->load(['roles.permissions', 'permissions']);

            DB::commit();

            return response()->json([
                'statusCode' => 2010,
                'message' => 'Staff created successfully',
                'data' => [
                    'staff' => $staff,
                    'user' => $user
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create staff: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List all staff members.
     */
    public function index()
    {
        $staffs = Staff::all();
        return response()->json([
            'statusCode' => 2000,
            'message' => 'Staff list fetched successfully',
            'data' => $staffs
        ], 200);
    }

    /**
     * Get all staff for dropdowns (lightweight).
     */
    public function list()
    {
        // Use all() to ensure safety and match index() behavior
        $staffs = Staff::all();
        
        return response()->json([
            'statusCode' => 2000,
            'message' => 'Staff list for dropdown fetched successfully',
            'data' => $staffs
        ], 200);
    }

    /**
     * Get staff by role (for dropdowns).
     */
    public function byRole($role)
    {
        try {
            // Find users with the given role
            $users = User::role($role)->get();
            
            // Extract user_names (which are staff_ids)
            $staffIds = $users->pluck('user_name');
            
            // Find staff records
            $staff = Staff::whereIn('staff_id', $staffIds)
                ->select('staff_id', 'full_name') // Select only needed fields
                ->get();
            
            return response()->json([
                'status' => 'success',
                'data' => $staff
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch staff by role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Staff By Id.
     */
    public function show($staff_id)
    {
        // Assuming staff_id is a string like ST0001
        $staff = Staff::where('staff_id', $staff_id)->first();

        if (!$staff) {
            return response()->json([
                'statusCode' => 4040,
                'message' => 'Staff not found'
            ], 404);
        }

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Staff details fetched successfully',
            'data' => $staff
        ], 200);
    }

    /**
     * Update staff details.
     */
    public function update(Request $request, $staff_id)
    {
        $staff = Staff::where('staff_id', $staff_id)->first();

        if (!$staff) {
            return response()->json([
                'statusCode' => 4040,
                'message' => 'Staff not found'
            ], 404);
        }

        $validated = $request->validate([
            'email_id' => 'nullable|email:filter|unique:staffs,email_id,' . $staff_id . ',staff_id',
            'account_status' => 'nullable|string',
            'contact_no' => 'nullable|string',
            'full_name' => 'nullable|string',
            'name_with_initial' => 'nullable|string',
            'address' => 'nullable|string',
            'nic' => ['nullable', 'string', 'regex:/^([0-9]{9}[x|X|v|V]|[0-9]{12})$/'],
            'work_info' => 'nullable',
            'age' => 'nullable|integer|min:18|max:80',
            'profile_image' => 'nullable|string',
            'gender' => 'nullable|string',
            'monthly_target_amount' => 'nullable|numeric|min:0',
            'monthly_target_count' => 'nullable|integer|min:0',
            'basic_salary' => 'nullable|numeric|min:0',
            'branch_id' => 'nullable|exists:branches,id',
            'center_id' => 'nullable|exists:centers,id',
            'role_name' => 'nullable|string|exists:roles,name', // Changed from 'role' to 'role_name'
        ]);

        DB::beginTransaction();
        try {
            // Update staff
            $staff->update($validated);

            // Update corresponding user if email or role changed
            $user = User::where('user_name', $staff_id)->first();
            if ($user) {
                if (isset($validated['email_id'])) {
                    $user->email = $validated['email_id'];
                }
                if (isset($validated['role_name'])) {
                    // Sync role using Spatie
                    $user->syncRoles([$validated['role_name']]);
                }
                if (isset($validated['account_status'])) {
                    $user->is_active = ($validated['account_status'] === 'active');
                }
                $user->save();

                // Load roles and permissions for response
                $user->load(['roles.permissions', 'permissions']);
            }

            DB::commit();

            return response()->json([
                'statusCode' => 2000,
                'message' => 'Staff updated successfully',
                'data' => $staff->fresh()
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update staff: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete Staff.
     */
    public function destroy($staff_id)
    {
        $staff = Staff::where('staff_id', $staff_id)->first();

        if (!$staff) {
            return response()->json([
                'statusCode' => 4040,
                'message' => 'Staff not found'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Disable or delete associated user logic if needed
            $user = User::where('user_name', $staff_id)->first();
            if ($user) {
                $user->delete();
            }

            $staff->delete();
            DB::commit();

            return response()->json([
                'statusCode' => 2000,
                'message' => 'Staff deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete staff: ' . $e->getMessage()
            ], 500);
        }
    }
}

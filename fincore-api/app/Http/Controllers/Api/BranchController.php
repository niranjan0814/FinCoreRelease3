<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class BranchController extends Controller
{
    
    /**
     * Get all branches for dropdowns/forms (only requires authentication, not permissions)
     */
    public function all()
    {
        try {
            $user = auth()->user();
            $query = Branch::orderBy('branch_name');

            // If user is not an admin/manager, limit to their assigned branch
            if (!$user->hasRole(['super_admin', 'admin', 'manager'])) {
                // Assuming the user is linked to a Staff record which has a branch_id
                if ($user->staff) {
                     $query->where('id', $user->staff->branch_id);
                } else {
                    // Fallback: if no staff record, maybe return nothing or handle gracefully
                    // For now, returning empty if not admin/manager and no staff record
                     $query->where('id', -1);
                }
            }

            $branches = $query->get();

            return response()->json([
                'success' => true,
                'data' => $branches
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching all branches', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve branches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $query = Branch::query();
            $isFiltered = false;

            // Filter by branch_id
            if ($request->has('branch_id')) {
                $query->where('branch_id', $request->branch_id);
                $isFiltered = true;
            }

            // Filter by branch_name (supports partial match)
            if ($request->has('branch_name')) {
                $query->where('branch_name', 'LIKE', '%' . $request->branch_name . '%');
                $isFiltered = true;
            }

            // Filter by location
            if ($request->has('location')) {
                $query->where('location', 'LIKE', '%' . $request->location . '%');
                $isFiltered = true;
            }

            $branches = $query->get();

            // Different message based on whether filters were applied
            $message = $isFiltered 
                ? 'Branch filter applied successfully' 
                : 'Branch list fetched successfully';

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => $message,
                'data' => $branches,
                'count' => $branches->count()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching branches', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'status_code' => 500,
                'message' => 'Failed to retrieve branches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

   
    public function store(Request $request)
    {
        try {
            // Validate input
            $validated = $request->validate([
                'branch_id' => 'nullable|string|unique:branches,branch_id',
                'branch_name' => 'required|string|max:255|unique:branches,branch_name',
                'location' => 'nullable|string|max:255',
                'address' => 'required|string',
                'city' => 'required|string|max:100',
                'province' => 'required|string|max:100',
                'postal_code' => 'required|string|max:20',
                'phone' => ['required', 'string', 'max:20', 'regex:/^(\+94|0)?[0-9]{9}$/'], // Validates SL format mostly
                'email' => 'required|email|max:255|unique:branches,email',
                'manager_name' => 'required|string|max:255',
                'manager_staff_id' => 'nullable|string',
                'staff_ids' => 'nullable|array',
                'staff_ids.*' => 'string|max:50',
            ], [
                'phone.regex' => 'The phone number format is invalid. Use format like 0771234567 or +94771234567',
                'email.email' => 'Please enter a valid email address',
            ]);

            // Auto-generate branch_id if not provided
            if (empty($validated['branch_id'])) {
                $latestBranch = Branch::latest('id')->first();
                $nextId = $latestBranch ? $latestBranch->id + 1 : 1;
                $validated['branch_id'] = 'BR' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
            }

            // Create branch
            $branch = Branch::create($validated);

            // Update Manager's Branch ID if provided
            if (!empty($request->manager_staff_id)) {
                $manager = \App\Models\Staff::where('staff_id', $request->manager_staff_id)->first();
                if ($manager) {
                    $manager->update(['branch_id' => $branch->id]);
                    Log::info('Updated Manager Branch ID', [
                        'manager_id' => $manager->staff_id,
                        'branch_id' => $branch->id
                    ]);
                } else {
                    Log::warning('Manager not found for branch assignment', ['staff_id' => $request->manager_staff_id]);
                }
            }

            // Log successful creation
            Log::info('Branch created successfully', [
                'branch_id' => $branch->id,
                'branch_name' => $branch->branch_name,
                'created_by' => auth()->id() ?? 'system'
            ]);

            return response()->json([
                'status' => 'success',
                'status_code' => 2010,
                'message' => 'Branch created successfully',
                'data' => $branch
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Check for duplicate errors
            $errors = $e->errors();
            
            if (isset($errors['branch_id']) || isset($errors['branch_name']) || isset($errors['email'])) {
                $isDuplicateId = false;
                $isDuplicateName = false;
                $isDuplicateEmail = false;

                if (isset($errors['branch_id'])) {
                    foreach ($errors['branch_id'] as $error) {
                        if (str_contains($error, 'has already been taken')) $isDuplicateId = true;
                    }
                }

                if (isset($errors['branch_name'])) {
                    foreach ($errors['branch_name'] as $error) {
                        if (str_contains($error, 'has already been taken')) $isDuplicateName = true;
                    }
                }

                if (isset($errors['email'])) {
                    foreach ($errors['email'] as $error) {
                        if (str_contains($error, 'has already been taken')) $isDuplicateEmail = true;
                    }
                }

                if ($isDuplicateId || $isDuplicateName || $isDuplicateEmail) {
                    $messages = [];
                    if ($isDuplicateId) $messages[] = 'Branch ID';
                    if ($isDuplicateName) $messages[] = 'Branch Name';
                    if ($isDuplicateEmail) $messages[] = 'Branch Email';

                    $msg = implode(' and ', $messages) . ' already exists';

                    return response()->json([
                        'status' => 'error',
                        'status_code' => 4090,
                        'message' => 'Duplicate entry found',
                        'error' => $msg,
                        'errors' => $errors
                    ], 409);
                }
            }

            // Other validation errors
            return response()->json([
                'status' => 'error',
                'status_code' => 422,
                'message' => 'Validation failed',
                'errors' => $errors
            ], 422);

        } catch (\Illuminate\Database\QueryException $e) {
            // Handle database duplicate entry (fallback)
            if ($e->getCode() == 23000) {
                Log::warning('Duplicate branch attempt', [
                    'data' => $request->all(),
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'status' => 'error',
                    'status_code' => 4090,
                    'message' => 'Branch already exists',
                    'error' => 'A branch with this ID already exists in the system'
                ], 409);
            }

            // Other database errors
            Log::error('Database error creating branch', [
                'error' => $e->getMessage(),
                'data' => $request->all()
            ]);

            return response()->json([
                'status' => 'error',
                'status_code' => 500,
                'message' => 'Failed to create branch',
                'error' => 'Database error occurred'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Unexpected error creating branch', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'status_code' => 500,
                'message' => 'Failed to create branch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

  
    public function show($id)
    {
        try {
            $branch = Branch::findOrFail($id);

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Branch details fetched successfully',
                'data' => $branch
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Branch not found', [
                'branch_id' => $id
            ]);

            return response()->json([
                'status' => 'error',
                'status_code' => 404,
                'message' => 'Branch not found',
                'error' => 'No branch exists with the specified ID'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error fetching branch', [
                'branch_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'status_code' => 500,
                'message' => 'Failed to retrieve branch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

   
    public function update(Request $request, $id)
    {
        try {
            $branch = Branch::findOrFail($id);

            // Store old data for logging
            $oldData = $branch->toArray();

            // Validate input
            $validated = $request->validate([
                'branch_id' => [
                    'sometimes',
                    'required',
                    'string',
                    Rule::unique('branches', 'branch_id')->ignore($branch->id)
                ],
                'branch_name' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('branches', 'branch_name')->ignore($branch->id)
                ],
                'location' => 'nullable|string|max:255',
                'address' => 'required|string',
                'city' => 'required|string|max:100',
                'province' => 'required|string|max:100',
                'postal_code' => 'required|string|max:20',
                'phone' => ['required', 'string', 'max:20', 'regex:/^(\+94|0)?[0-9]{9}$/'],
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('branches', 'email')->ignore($branch->id)
                ],
                'manager_name' => 'required|string|max:255',
                'manager_staff_id' => 'nullable|string',
                'staff_ids' => 'nullable|array',
                'staff_ids.*' => 'string|max:50',
            ], [
                'phone.regex' => 'The phone number format is invalid. Use format like 0771234567 or +94771234567',
                'email.email' => 'Please enter a valid email address',
            ]);

            // Update branch
            $branch->update($validated);

            // Update Manager's Branch ID if provided
            if (!empty($request->manager_staff_id)) {
                // Optional: Clear branch_id from other staff of this branch? 
                // For now, just ensure the specific manager is assigned.
                $manager = \App\Models\Staff::where('staff_id', $request->manager_staff_id)->first();
                if ($manager) {
                    $manager->update(['branch_id' => $branch->id]);
                }
            }

            // Log update
            Log::info('Branch updated successfully', [
                'branch_id' => $id,
                'old_data' => $oldData,
                'new_data' => $branch->fresh()->toArray(),
                'updated_by' => auth()->id() ?? 'system'
            ]);

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Branch updated successfully',
                'data' => $branch->fresh()
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Branch not found for update', [
                'branch_id' => $id
            ]);

            return response()->json([
                'status' => 'error',
                'status_code' => 404,
                'message' => 'Branch not found',
                'error' => 'No branch exists with the specified ID'
            ], 404);

        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->errors();
            
            // Check for duplicate errors
            $errors = $e->errors();
            
            if (isset($errors['branch_id']) || isset($errors['branch_name']) || isset($errors['email'])) {
                $isDuplicateId = false;
                $isDuplicateName = false;
                $isDuplicateEmail = false;

                if (isset($errors['branch_id'])) {
                    foreach ($errors['branch_id'] as $error) {
                        if (str_contains($error, 'has already been taken')) $isDuplicateId = true;
                    }
                }

                if (isset($errors['branch_name'])) {
                    foreach ($errors['branch_name'] as $error) {
                        if (str_contains($error, 'has already been taken')) $isDuplicateName = true;
                    }
                }

                if (isset($errors['email'])) {
                    foreach ($errors['email'] as $error) {
                        if (str_contains($error, 'has already been taken')) $isDuplicateEmail = true;
                    }
                }

                if ($isDuplicateId || $isDuplicateName || $isDuplicateEmail) {
                    $messages = [];
                    if ($isDuplicateId) $messages[] = 'Branch ID';
                    if ($isDuplicateName) $messages[] = 'Branch Name';
                    if ($isDuplicateEmail) $messages[] = 'Branch Email';

                    $msg = 'Another branch with this ' . implode(' or ', $messages) . ' already exists';

                    return response()->json([
                        'status' => 'error',
                        'status_code' => 4090,
                        'message' => 'Duplicate entry found',
                        'error' => $msg,
                        'errors' => $errors
                    ], 409);
                }
            }

            // Other validation errors
            return response()->json([
                'status' => 'error',
                'status_code' => 422,
                'message' => 'Validation failed',
                'errors' => $errors
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error updating branch', [
                'branch_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'status_code' => 500,
                'message' => 'Failed to update branch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

   
    public function destroy($id)
    {
        try {
            $branch = Branch::findOrFail($id);
            
            // Store branch data before deletion for logging
            $deletedData = $branch->toArray();
            
            // Delete branch
            $branch->delete();

            // Log deletion
            Log::info('Branch deleted successfully', [
                'branch_id' => $id,
                'deleted_data' => $deletedData,
                'deleted_by' => auth()->id() ?? 'system'
            ]);

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Branch deleted successfully'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Branch not found for deletion', [
                'branch_id' => $id
            ]);

            return response()->json([
                'status' => 'error',
                'status_code' => 404,
                'message' => 'Branch not found',
                'error' => 'No branch exists with the specified ID'
            ], 404);

        } catch (\Illuminate\Database\QueryException $e) {
            // Handle foreign key constraint errors
            if ($e->getCode() == 23000) {
                Log::warning('Cannot delete branch due to constraints', [
                    'branch_id' => $id,
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'status' => 'error',
                    'status_code' => 409,
                    'message' => 'Cannot delete branch',
                    'error' => 'This branch is referenced by other records and cannot be deleted'
                ], 409);
            }

            Log::error('Database error deleting branch', [
                'branch_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'status_code' => 500,
                'message' => 'Failed to delete branch',
                'error' => 'Database error occurred'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Error deleting branch', [
                'branch_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'status_code' => 500,
                'message' => 'Failed to delete branch',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
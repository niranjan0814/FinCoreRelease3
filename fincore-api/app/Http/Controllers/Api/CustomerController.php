<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Branch;
use App\Models\Center;
use App\Models\Group;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    /**
     * Create a new Customer (Field Officer only).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Product / Location Details (optional)
            'branch_id' => 'required|exists:branches,id',
            'center_id' => 'required|exists:centers,id',
            'grp_id' => 'nullable|exists:groups,id',
            'location' => 'nullable|string',
            'product_type' => 'nullable|string',
            'base_product' => 'nullable|string',
            'pcsu_csu_code' => 'nullable|string',

            // Customer Personal Details (required)
            'code_type' => 'required|string|in:' . Customer::CODE_TYPE, // Must be 'NIC'
            'customer_code' => ['required', 'string', 'regex:/^([0-9]{9}[x|X|v|V]|[0-9]{12})$/'], // NIC validation without unique (we'll check manually)
            'gender' => 'required|in:Female',
            'title' => 'required|string',
            'full_name' => 'required|string',
            'initials' => 'required|string',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'date_of_birth' => 'required|date|before:today|after:1900-01-01',
            'civil_status' => 'required|in:Single,Married,Divorced,Widowed',
            'religion' => 'required|string|in:' . implode(',', Customer::RELIGIONS),
            'mobile_no_1' => ['required', 'string', 'regex:/^\d{10}$/'],
            'mobile_no_2' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'ccl_mobile_no' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'spouse_name' => 'nullable|string',
            'health_info' => 'nullable|json',
            'family_members_count' => 'nullable|integer|min:1|max:20',
            'customer_profile_image' => 'nullable|string',
            'monthly_income' => 'nullable|numeric|min:0',

            // Customer Address Details (required)
            'address_type' => 'required|string|max:255',
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'address_line_3' => 'nullable|string|max:255',
            'country' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'district' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'gs_division' => 'required|string|max:255',
            'telephone' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'preferred_address' => 'nullable|boolean',

            // Business Details (all optional)
            'ownership_type' => 'nullable|string|in:' . implode(',', Customer::OWNERSHIP_TYPES),
            'register_number' => 'nullable|string',
            'business_name' => 'nullable|string',
            'business_email' => 'nullable|email:filter',
            'business_duration' => 'nullable|string',
            'business_place' => 'nullable|string',
            'handled_by' => 'nullable|string',
            'no_of_employees' => 'nullable|integer',
            'market_reputation' => 'nullable|string',
            'sector' => 'nullable|string',
            'sub_sector' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'statusCode' => 4000,
                'message' => 'Invalid customer data',
                'errors' => $validator->errors()
            ], 400);
        }

        $validated = $validator->validated();

        // ===== CUSTOM NIC DUPLICATE VALIDATION =====
        // Check if customer with this NIC already exists in any center
        $existingCustomer = Customer::with(['center', 'branch'])
            ->where('customer_code', strtoupper($validated['customer_code']))
            ->first();

        if ($existingCustomer) {
            $centerName = $existingCustomer->center?->center_name ?? 'Unknown Center';
            $branchName = $existingCustomer->branch?->branch_name ?? 'Unknown Branch';
            $customerName = $existingCustomer->full_name;
            $customerStatus = ucfirst($existingCustomer->status ?? 'active');

            return response()->json([
                'statusCode' => 4090,
                'message' => 'Customer with this NIC already exists',
                'errors' => [
                    'customer_code' => [
                        "A customer with NIC '{$validated['customer_code']}' already exists.",
                        "Customer Name: {$customerName}",
                        "Center: {$centerName}",
                        "Branch: {$branchName}",
                        "Status: {$customerStatus}",
                        "A customer cannot be registered in multiple centers at the same time."
                    ]
                ],
                'existing_customer' => [
                    'id' => $existingCustomer->id,
                    'full_name' => $customerName,
                    'customer_code' => $existingCustomer->customer_code,
                    'center_id' => $existingCustomer->center_id,
                    'center_name' => $centerName,
                    'branch_id' => $existingCustomer->branch_id,
                    'branch_name' => $branchName,
                    'status' => $existingCustomer->status,
                ]
            ], 409); // 409 Conflict
        }
        // ===== END NIC VALIDATION =====

        // Extract gender from Sri Lankan NIC
        $nic = $validated['customer_code'];
        $genderFromNIC = $this->extractGenderFromNIC($nic);

        if (!$genderFromNIC) {
            return response()->json([
                'statusCode' => 4220,
                'message' => 'Invalid Sri Lankan NIC format',
                'errors' => [
                    'customer_code' => ['The NIC format is invalid. Please enter a valid Sri Lankan NIC.']
                ]
            ], 422);
        }

        // Validate that provided gender matches NIC
        if ($genderFromNIC !== $validated['gender']) {
            return response()->json([
                'statusCode' => 4221,
                'message' => 'Gender mismatch with NIC',
                'errors' => [
                    'gender' => ["Gender mismatch. NIC indicates gender is {$genderFromNIC}, but you provided {$validated['gender']}"]
                ]
            ], 422);
        }

        // Only females can get loans
        if ($genderFromNIC !== 'Female') {
            return response()->json([
                'statusCode' => 4030,
                'message' => 'Only female customers are eligible',
                'errors' => [
                    'gender' => ['Only female customers are eligible for loans in this program']
                ]
            ], 403);
        }

        // Calculate age from date of birth
        $dateOfBirth = new \DateTime($validated['date_of_birth']);
        $today = new \DateTime('today');
        $age = $dateOfBirth->diff($today)->y;

        // Validate age range for loan eligibility
        if ($age < Customer::MIN_AGE) {
            return response()->json([
                'statusCode' => 4222,
                'message' => 'Customer is too young',
                'errors' => [
                    'date_of_birth' => ["Customer must be at least " . Customer::MIN_AGE . " years old to be eligible for loans. Current age: {$age} years"]
                ]
            ], 422);
        }

        if ($age > Customer::MAX_AGE) {
            return response()->json([
                'statusCode' => 4223,
                'message' => 'Customer exceeds maximum age',
                'errors' => [
                    'date_of_birth' => ["Customer must be " . Customer::MAX_AGE . " years old or younger to be eligible for loans. Current age: {$age} years"]
                ]
            ], 422);
        }

        try {
            // Store NIC in uppercase for consistency
            $validated['customer_code'] = strtoupper($validated['customer_code']);

            $customer = Customer::create($validated);

            return response()->json([
                'statusCode' => 2010,
                'message' => 'Customer created successfully',
                'data' => $customer->load(['branch', 'center', 'group'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 5000,
                'message' => 'Failed to create customer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List all customers or filter.
     */
    public function index(Request $request)
    {
        $query = Customer::query();
        $isFiltered = false;

        // Apply simple filters if present
        if ($request->has('full_name')) {
            $query->where('full_name', 'like', '%' . $request->full_name . '%');
            $isFiltered = true;
        }
        if ($request->has('customer_code')) {
            $query->where('customer_code', 'like', '%' . $request->customer_code . '%');
            $isFiltered = true;
        }
        if ($request->has('gender')) {
            $query->where('gender', $request->gender);
            $isFiltered = true;
        }
        if ($request->has('center_id')) {
            $query->where('center_id', $request->center_id);
            $isFiltered = true;
        }
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
            $isFiltered = true;
        }
        if ($request->has('grp_id')) {
            $query->where('grp_id', $request->grp_id);
            $isFiltered = true;
        }
        // Add more filters as needed

        $query->with(['branch', 'center', 'group', 'loans']);
        $query->withCount([
            'loans as active_loans_count' => function ($q) {
                $q->where('status', \App\Models\Loan::STATUS_ACTIVE);
            }
        ]);
        $customers = $query->get();

        $message = $isFiltered
            ? 'Customer filter applied successfully'
            : 'Customer list fetched successfully';

        return response()->json([
            'statusCode' => 2000,
            'message' => $message,
            'data' => $customers
        ], 200);
    }

    /**
     * Get a specific customer.
     */
    public function show($id)
    {
        $customer = Customer::with(['branch', 'center', 'group', 'loans'])
            ->withCount([
                'loans as active_loans_count' => function ($q) {
                    $q->where('status', \App\Models\Loan::STATUS_ACTIVE);
                }
            ])
            ->find($id);

        if (!$customer) {
            return response()->json([
                'statusCode' => 4040,
                'message' => 'Customer not found'
            ], 404);
        }

        return response()->json([
            'statusCode' => 2000,
            'message' => 'Customer details fetched successfully',
            'data' => $customer
        ], 200);
    }

    /**
     * Update customer details.
     */
    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'statusCode' => 4040,
                'message' => 'Customer not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            // All fields are optional in update
            'branch_id' => 'nullable|exists:branches,id',
            'center_id' => 'nullable|exists:centers,id',
            'grp_id' => 'nullable|exists:groups,id',
            'location' => 'nullable|string',
            'product_type' => 'nullable|string',
            'base_product' => 'nullable|string',
            'pcsu_csu_code' => 'nullable|string',
            'code_type' => 'nullable|string|in:' . Customer::CODE_TYPE, // Must be 'NIC' if provided
            'customer_code' => ['nullable', 'string', 'regex:/^([0-9]{9}[x|X|v|V]|[0-9]{12})$/'], // NIC validation without unique (we'll check manually)
            'gender' => 'nullable|in:Female',
            'title' => 'nullable|string',
            'full_name' => 'nullable|string',
            'initials' => 'nullable|string',
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'date_of_birth' => 'nullable|date|before:today|after:1900-01-01',
            'civil_status' => 'nullable|in:Single,Married,Divorced,Widowed',
            'religion' => 'nullable|string|in:' . implode(',', Customer::RELIGIONS),
            'mobile_no_1' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'mobile_no_2' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'ccl_mobile_no' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'spouse_name' => 'nullable|string',
            'health_info' => 'nullable|json',
            'family_members_count' => 'nullable|integer|min:1|max:20',
            'customer_profile_image' => 'nullable|string',
            'monthly_income' => 'nullable|numeric|min:0',
            'address_type' => 'nullable|string|max:255',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'address_line_3' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'district' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'gs_division' => 'nullable|string|max:255',
            'telephone' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'preferred_address' => 'nullable|boolean',
            'ownership_type' => 'nullable|string|in:' . implode(',', Customer::OWNERSHIP_TYPES),
            'status' => 'nullable|string|in:' . implode(',', Customer::STATUSES),
            'register_number' => 'nullable|string',
            'business_name' => 'nullable|string',
            'business_email' => 'nullable|email:filter',
            'business_duration' => 'nullable|string',
            'business_place' => 'nullable|string',
            'handled_by' => 'nullable|string',
            'no_of_employees' => 'nullable|integer',
            'market_reputation' => 'nullable|string',
            'sector' => 'nullable|string',
            'sub_sector' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'statusCode' => 4000,
                'message' => 'Invalid customer data',
                'errors' => $validator->errors()
            ], 400);
        }

        $validated = $validator->validated();

        // ===== CUSTOM NIC DUPLICATE VALIDATION (for updates) =====
        if (isset($validated['customer_code'])) {
            $nicToCheck = strtoupper($validated['customer_code']);

            // Check if another customer (not this one) has the same NIC
            $existingCustomer = Customer::with(['center', 'branch'])
                ->where('customer_code', $nicToCheck)
                ->where('id', '!=', $id) // Exclude current customer
                ->first();

            if ($existingCustomer) {
                $centerName = $existingCustomer->center?->center_name ?? 'Unknown Center';
                $branchName = $existingCustomer->branch?->branch_name ?? 'Unknown Branch';
                $customerName = $existingCustomer->full_name;
                $customerStatus = ucfirst($existingCustomer->status ?? 'active');

                return response()->json([
                    'statusCode' => 4090,
                    'message' => 'Customer with this NIC already exists',
                    'errors' => [
                        'customer_code' => [
                            "A customer with NIC '{$nicToCheck}' already exists.",
                            "Customer Name: {$customerName}",
                            "Center: {$centerName}",
                            "Branch: {$branchName}",
                            "Status: {$customerStatus}",
                            "A customer cannot be registered in multiple centers at the same time."
                        ]
                    ],
                    'existing_customer' => [
                        'id' => $existingCustomer->id,
                        'full_name' => $customerName,
                        'customer_code' => $existingCustomer->customer_code,
                        'center_id' => $existingCustomer->center_id,
                        'center_name' => $centerName,
                        'branch_id' => $existingCustomer->branch_id,
                        'branch_name' => $branchName,
                        'status' => $existingCustomer->status,
                    ]
                ], 409); // 409 Conflict
            }

            // Store NIC in uppercase for consistency
            $validated['customer_code'] = $nicToCheck;
        }
        // ===== END NIC VALIDATION =====

        try {
            $user = auth()->user();
            $hasActiveLoans = $customer->loans()->where('status', \App\Models\Loan::STATUS_ACTIVE)->exists();

            // 🛡️ Logic for Field Officer Editing
            $isExplicitlyUnlocked = $customer->is_edit_locked === false; // Manager specifically unlocked it
            $mustRequestApproval = $user->hasRole('field_officer') && $hasActiveLoans && !$isExplicitlyUnlocked;

            if ($mustRequestApproval) {
                // Check for existing pending request
                $existingPending = \App\Models\CustomerEditRequest::where('customer_id', $id)
                    ->where('status', 'pending')
                    ->exists();

                if ($existingPending) {
                    return response()->json([
                        'statusCode' => 4001,
                        'message' => 'There is already a pending edit request for this customer.'
                    ], 400);
                }

                // Create edit request instead of updating
                $editRequest = \App\Models\CustomerEditRequest::create([
                    'customer_id' => $id,
                    'requested_by' => $user->id,
                    'old_data' => $customer->toArray(),
                    'new_data' => $validated,
                    'status' => 'pending'
                ]);

                $customer->update([
                    'edit_request_status' => 'pending',
                    'is_edit_locked' => true
                ]);

                return response()->json([
                    'statusCode' => 2020,
                    'message' => 'Update request submitted for Manager approval.',
                    'data' => $customer->load(['branch', 'center', 'group'])
                ], 202);
            }

            // Otherwise, update directly (Admins, Managers, or Unlocked Field Officer)
            $customer->update($validated);

            // 🔒 Re-lock if there are active loans to ensure future edits need approval
            if ($hasActiveLoans) {
                $customer->update([
                    'is_edit_locked' => true,
                    // keep edit_request_status as 'approved' or update to null
                ]);
            }

            // If it was a manual fix by manager, reset flags
            if (!$user->hasRole('field_officer')) {
                $customer->update([
                    'edit_request_status' => 'approved',
                    'is_edit_locked' => false
                ]);
            }

            return response()->json([
                'statusCode' => 2000,
                'message' => 'Customer updated successfully',
                'data' => $customer->load(['branch', 'center', 'group'])
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 5000,
                'message' => 'Failed to update customer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete Customer.
     */
    public function destroy($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'statusCode' => 4040,
                'message' => 'Customer not found'
            ], 404);
        }

        try {
            $customer->delete();

            return response()->json([
                'statusCode' => 2000,
                'message' => 'Customer deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete customer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import Customers from CSV.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls,ods'
        ]);

        try {
            $file = $request->file('file');
            $handle = fopen($file->getRealPath(), 'r');

            // Handle BOM (Byte Order Mark) fix for Excel created CSVs
            $bom = fread($handle, 3);
            if ($bom != "\xEF\xBB\xBF") {
                rewind($handle);
            }

            $headers = fgetcsv($handle);

            if (!$headers) {
                return response()->json([
                    'statusCode' => 4000,
                    'message' => 'The uploaded CSV file is empty or invalid.'
                ], 400);
            }

            // Normalize headers: lowercase, trim, and replace separators with underscores
            $headers = array_map(function ($h) {
                $h = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h); // Remove invisible chars
                return trim(strtolower(str_replace([' ', '-', '/'], '_', $h)));
            }, $headers);

            $importCount = 0;
            $errorCount = 0;
            $errors = [];
            $errorsDetailed = [];
            $dryRun = filter_var($request->get('dry_run', false), FILTER_VALIDATE_BOOLEAN);
            $returnErrorsCsv = filter_var($request->get('errors_csv', false), FILTER_VALIDATE_BOOLEAN);

            while (($row = fgetcsv($handle)) !== false) {
                // Skip empty rows
                if (empty(array_filter($row)))
                    continue;

                // Ensure row has same column count as headers
                // Pad with null if row is shorter
                if (count($row) < count($headers)) {
                    $row = array_pad($row, count($headers), null);
                } else if (count($row) > count($headers)) {
                    $row = array_slice($row, 0, count($headers));
                }

                $data = array_combine($headers, $row);

                try {
                    // Start building customer data with defaults
                    // We explicitly DO NOT map 'id' from the CSV to the database
                    $customerData = [
                        'code_type' => 'NIC',
                        'customer_code' => isset($data['customer_code']) ? strtoupper($data['customer_code']) : (isset($data['nic']) ? strtoupper($data['nic']) : null),
                        'full_name' => $data['full_name'] ?? null,
                        'gender' => $data['gender'] ?? 'Female',
                        'title' => $data['title'] ?? 'Mrs',
                        'mobile_no_1' => $data['mobile_1'] ?? $data['mobile_no_1'] ?? $data['mobile_1_'] ?? null,
                        'mobile_no_2' => $data['mobile_2'] ?? $data['mobile_no_2'] ?? null,
                        'date_of_birth' => isset($data['date_of_birth']) ? date('Y-m-d', strtotime($data['date_of_birth'])) : null,
                        'monthly_income' => $data['monthly_income'] ?? 0,
                        'status' => $data['status'] ?? 'active',
                        'address_type' => 'Home Address',
                        'address_line_1' => $data['address'] ?? $data['address_line_1'] ?? 'N/A',
                        'country' => 'Sri Lanka',
                        'civil_status' => $data['civil_status'] ?? 'Married',
                        'religion' => $data['religion'] ?? 'Buddhism',
                        'province' => $data['province'] ?? 'Western',
                        'district' => $data['district'] ?? 'Colombo',
                        'city' => $data['city'] ?? $data['district'] ?? 'Colombo',
                        'gs_division' => $data['gs_division'] ?? 'N/A',
                        'initials' => 'N/A',
                        'first_name' => 'N/A',
                        'last_name' => 'N/A',
                    ];

                    // Smart split of full name if possible
                    if ($customerData['full_name']) {
                        $nameParts = explode(' ', $customerData['full_name']);
                        $customerData['first_name'] = $nameParts[0];
                        $customerData['last_name'] = end($nameParts);
                    }

                    // Branch lookup (Priority: Code > ID > Name)
                    if (isset($data['branch']) && !empty($data['branch'])) {
                        $val = trim($data['branch']);
                        \Illuminate\Support\Facades\Log::info("Row $importCount: Searching Branch for '$val'");

                        // 1. Try Business Code (e.g., BR0001)
                        $branch = \App\Models\Branch::where('branch_id', $val)->first();

                        // 2. Try System ID (only if numeric)
                        if (!$branch && is_numeric($val)) {
                            $branch = \App\Models\Branch::find($val);
                        }

                        // 3. Try Name (Fuzzy)
                        if (!$branch) {
                            $branch = \App\Models\Branch::where('branch_name', 'like', '%' . $val . '%')->first();
                        }

                        if ($branch) {
                            $customerData['branch_id'] = $branch->id;
                            \Illuminate\Support\Facades\Log::info("Row $importCount: Found Branch ID {$branch->id} for '$val'");
                        } else {
                            \Illuminate\Support\Facades\Log::error("Row $importCount: Branch not found for '$val'");
                            throw new \Exception("Could not find Branch matching '$val' (checked Code, ID, and Name)");
                        }
                    } else {
                        \Illuminate\Support\Facades\Log::error("Row $importCount: Branch column missing or empty");
                    }

                    // Center lookup (Priority: Code > ID > Name)
                    if (isset($data['center']) && !empty($data['center'])) {
                        $val = trim($data['center']);
                        \Illuminate\Support\Facades\Log::info("Row $importCount: Searching Center for '$val'");

                        // 1. Try Business Code (e.g., CSU0001)
                        $center = \App\Models\Center::where('CSU_id', $val)->first();

                        // 2. Try System ID (only if numeric)
                        if (!$center && is_numeric($val)) {
                            $center = \App\Models\Center::find($val);
                        }

                        // 3. Try Name (Fuzzy)
                        if (!$center) {
                            $center = \App\Models\Center::where('center_name', 'like', '%' . $val . '%')->first();
                        }

                        if ($center) {
                            $customerData['center_id'] = $center->id;
                            \Illuminate\Support\Facades\Log::info("Row $importCount: Found Center ID {$center->id} for '$val'");
                        } else {
                            \Illuminate\Support\Facades\Log::error("Row $importCount: Center not found for '$val'");
                            throw new \Exception("Could not find Center matching '$val' (checked Code, ID, and Name)");
                        }
                    } else {
                        \Illuminate\Support\Facades\Log::error("Row $importCount: Center column missing or empty");
                    }

                    // Group lookup (Priority: ID > Name) - Scoped to Center
                    if (isset($data['group']) && !empty($data['group']) && isset($customerData['center_id'])) {
                        $val = trim($data['group']);
                        \Illuminate\Support\Facades\Log::info("Row $importCount: Searching Group for '$val' in Center {$customerData['center_id']}");

                        $group = null;

                        // 1. Try System ID (only if numeric)
                        if (is_numeric($val)) {
                            $group = \App\Models\Group::where('center_id', $customerData['center_id'])
                                ->where('id', $val)
                                ->first();
                        }

                        // 2. Try Name (Exact)
                        if (!$group) {
                            $group = \App\Models\Group::where('center_id', $customerData['center_id'])
                                ->where('group_name', $val)
                                ->first();
                        }

                        if ($group) {
                            $customerData['grp_id'] = $group->id;
                            \Illuminate\Support\Facades\Log::info("Row $importCount: Found Group ID {$group->id} for '$val'");
                        } else {
                            // Warn but don't fail, as Group is optional (nullable)
                            \Illuminate\Support\Facades\Log::warning("Row $importCount: Group '$val' not found in Center {$customerData['center_id']}");
                        }
                    }

                    if (!$customerData['customer_code'] || !$customerData['full_name'] || !isset($customerData['branch_id']) || !isset($customerData['center_id'])) {
                        throw new \Exception("Missing required fields (NIC, Name, Branch or Center)");
                    }

                    if (\App\Models\Customer::where('customer_code', $customerData['customer_code'])->exists()) {
                        throw new \Exception("Customer with NIC " . $customerData['customer_code'] . " already exists");
                    }

                    $rules = [
                        'branch_id' => 'required|exists:branches,id',
                        'center_id' => 'required|exists:centers,id',
                        'code_type' => 'required|string|in:' . \App\Models\Customer::CODE_TYPE,
                        'customer_code' => ['required', 'string', 'regex:/^([0-9]{9}[x|X|v|V]|[0-9]{12})$/'],
                        'gender' => 'required|in:Female',
                        'title' => 'required|string',
                        'full_name' => 'required|string',
                        'date_of_birth' => 'nullable|date|before:today|after:1900-01-01',
                        'civil_status' => 'nullable|in:Single,Married,Divorced,Widowed',
                        'religion' => 'nullable|string|in:' . implode(',', \App\Models\Customer::RELIGIONS),
                        'mobile_no_1' => ['required', 'string', 'regex:/^\d{10}$/'],
                        'mobile_no_2' => ['nullable', 'string', 'regex:/^\d{10}$/'],
                        'status' => 'nullable|in:' . implode(',', \App\Models\Customer::STATUSES),
                        'monthly_income' => 'nullable|numeric|min:0',
                        'province' => 'nullable|string',
                        'district' => 'nullable|string',
                        'city' => 'nullable|string',
                    ];

                    $validator = \Illuminate\Support\Facades\Validator::make($customerData, $rules);
                    if ($validator->fails()) {
                        $msg = collect($validator->errors()->toArray())->map(function ($arr, $field) {
                            return $field . ': ' . implode('; ', $arr); })->implode(' | ');
                        throw new \Exception($msg);
                    }

                    if ($customerData['date_of_birth']) {
                        $dob = new \DateTime($customerData['date_of_birth']);
                        $age = $dob->diff(new \DateTime('today'))->y;
                        if ($age < \App\Models\Customer::MIN_AGE || $age > \App\Models\Customer::MAX_AGE) {
                            throw new \Exception('Invalid age based on date_of_birth');
                        }
                    }

                    if (!$dryRun) {
                        \App\Models\Customer::create($customerData);
                    }
                    $importCount++;
                } catch (\Exception $e) {
                    $errorCount++;
                    $errors[] = "Row " . ($importCount + $errorCount + 1) . ": " . $e->getMessage();
                    $errorsDetailed[] = [
                        'row' => ($importCount + $errorCount + 1),
                        'error' => $e->getMessage()
                    ];
                }
            }
            fclose($handle);

            if ($returnErrorsCsv && $errorCount > 0) {
                $headersOut = [
                    "Content-type" => "text/csv",
                    "Content-Disposition" => "attachment; filename=customer_import_errors_" . date('Y-m-d_His') . ".csv",
                    "Pragma" => "no-cache",
                    "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                    "Expires" => "0"
                ];
                $callback = function () use ($errorsDetailed) {
                    $fileOut = fopen('php://output', 'w');
                    fputcsv($fileOut, ['Row', 'Error']);
                    foreach ($errorsDetailed as $err) {
                        fputcsv($fileOut, [$err['row'], $err['error']]);
                    }
                    fclose($fileOut);
                };
                return response()->stream($callback, 200, $headersOut);
            }

            $allFailed = ($importCount === 0 && $errorCount > 0);
            $partialSuccess = ($importCount > 0 && $errorCount > 0);
            $allSuccess = ($importCount > 0 && $errorCount === 0);

            if ($allFailed) {
                return response()->json([
                    'statusCode' => 4225,
                    'message' => ($dryRun ? "Dry-run failed: " : "Import failed: ") . "$importCount processed, $errorCount failed.",
                    'data' => [
                        'processed' => $importCount,
                        'failed' => $errorCount,
                        'dry_run' => $dryRun,
                        'errors' => array_slice($errors, 0, 50)
                    ]
                ], 422);
            }

            if ($partialSuccess) {
                return response()->json([
                    'statusCode' => 2001,
                    'message' => ($dryRun ? "Dry-run partially completed: " : "Import partially completed: ") . "$importCount processed, $errorCount failed.",
                    'data' => [
                        'processed' => $importCount,
                        'failed' => $errorCount,
                        'dry_run' => $dryRun,
                        'errors' => array_slice($errors, 0, 50)
                    ]
                ], 200);
            }

            return response()->json([
                'statusCode' => 2000,
                'message' => ($dryRun ? "Dry-run completed successfully: " : "Import completed successfully: ") . "$importCount processed, $errorCount failed.",
                'data' => [
                    'processed' => $importCount,
                    'failed' => $errorCount,
                    'dry_run' => $dryRun,
                    'errors' => []
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to import customers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export Customers to CSV.
     */
    /**
     * Export Customers to CSV.
     */
    public function export()
    {
        try {
            $customers = Customer::with(['branch', 'center', 'group'])->get();

            $headers = [
                "Content-type" => "text/csv",
                "Content-Disposition" => "attachment; filename=customers_" . date('Y-m-d_His') . ".csv",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0"
            ];

            // These headers match the 'import' expectation
            $columns = [
                'ID',
                'Customer Code',
                'Full Name',
                'NIC',
                'Mobile 1',
                'Mobile 2',
                'Gender',
                'Title',
                'Date of Birth',
                'Address',
                'City',
                'District',
                'Branch',
                'Center',
                'Group',
                'Status',
                'Monthly Income'
            ];

            $callback = function () use ($customers, $columns) {
                $file = fopen('php://output', 'w');
                fputcsv($file, $columns);

                foreach ($customers as $customer) {
                    // Use CODES (e.g. branch_id b01) instead of Names for better re-import reliability
                    // Fallback to name if code is missing
                    $branchVal = $customer->branch ? ($customer->branch->branch_id ?? $customer->branch->branch_name) : '';
                    $centerVal = $customer->center ? ($customer->center->CSU_id ?? $customer->center->center_name) : '';
                    $groupVal = $customer->group ? ($customer->group->group_code ?? $customer->group->group_name) : '';

                    $row = [
                        $customer->id,
                        $customer->customer_code,
                        $customer->full_name,
                        $customer->customer_code, // NIC column
                        $customer->mobile_no_1,
                        $customer->mobile_no_2,
                        $customer->gender,
                        $customer->title,
                        $customer->date_of_birth,
                        $customer->address_line_1 . ($customer->address_line_2 ? ', ' . $customer->address_line_2 : ''),
                        $customer->city,
                        $customer->district,
                        $branchVal, // Exporting Code (b01) preferred
                        $centerVal, // Exporting Code (CSU_id) preferred
                        $groupVal,
                        $customer->status,
                        $customer->monthly_income
                    ];

                    fputcsv($file, $row);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export customers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer constants for frontend forms
     */
    public function getConstants()
    {
        $branches = Branch::select('id', 'branch_name')->get();
        $centers = Center::select('id', 'center_name', 'branch_id', 'staff_id', 'status')->get();
        $groups = Group::select('id', 'group_name', 'center_id')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'branches' => $branches,
                'centers' => $centers,
                'groups' => $groups,
                'country' => Customer::COUNTRY,
                'provinces' => Customer::PROVINCES,
                'province_districts_map' => Customer::PROVINCE_DISTRICTS,
                'districts' => Customer::DISTRICTS,
                'cities' => Customer::CITIES,
                'code_types' => [Customer::CODE_TYPE],
                'religions' => Customer::RELIGIONS,
                'statuses' => Customer::STATUSES,
                'ownership_types' => Customer::OWNERSHIP_TYPES,
                'age_limits' => [
                    'min' => Customer::MIN_AGE,
                    'max' => Customer::MAX_AGE
                ]
            ]
        ], 200);
    }

    /**
     * Check if a customer is eligible for a center transfer.
     */
    public function checkTransferEligibility($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Customer not found'
            ], 404);
        }

        // 1. Check if the customer has active loans
        $hasActiveLoan = \App\Models\Loan::where('customer_id', $customer->id)
            ->whereIn('status', \App\Models\Loan::ACTIVE_STATUSES)
            ->exists();

        if ($hasActiveLoan) {
            return response()->json([
                'eligible' => false,
                'message' => 'Customer has an ongoing active loan. All individual loans must be finished before transferring.'
            ], 422);
        }

        // 2. Check group members' loans if customer is in a group
        if ($customer->grp_id) {
            $groupMembers = Customer::where('grp_id', $customer->grp_id)
                ->where('id', '!=', $customer->id)
                ->get();

            foreach ($groupMembers as $member) {
                $memberHasActiveLoan = \App\Models\Loan::where('customer_id', $member->id)
                    ->whereIn('status', \App\Models\Loan::ACTIVE_STATUSES)
                    ->exists();

                if ($memberHasActiveLoan) {
                    return response()->json([
                        'eligible' => false,
                        'message' => "Group member '{$member->full_name}' still has an active loan. Solidarity group rules require all 2 other members to finish their loans before any member can transfer."
                    ], 422);
                }
            }
        }

        return response()->json([
            'eligible' => true,
            'message' => 'Customer is eligible for center transfer.'
        ], 200);
    }

    /**
     * Extract gender from Sri Lankan NIC
     * Old format: 9 digits + V (e.g., 856234567V)
     * New format: 12 digits (e.g., 198562345678)
     */
    private function extractGenderFromNIC($nic)
    {
        $nic = strtoupper(trim($nic));

        // Old NIC format (9 digits + V)
        if (preg_match('/^(\d{9})V$/', $nic, $matches)) {
            $dayValue = intval(substr($matches[1], 2, 3));

            // If day value > 500, it's female
            if ($dayValue > 500) {
                return 'Female';
            } else {
                return 'Male';
            }
        }

        // New NIC format (12 digits)
        if (preg_match('/^(\d{12})$/', $nic)) {
            $dayValue = intval(substr($nic, 4, 3));

            // If day value > 500, it's female
            if ($dayValue > 500) {
                return 'Female';
            } else {
                return 'Male';
            }
        }

        return null; // Invalid format
    }
}

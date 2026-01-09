<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Services\LoanDueDateService;
use Illuminate\Http\Request;
use App\Notifications\LoanStatusNotification;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Loan::with(['customer', 'product', 'center.branch.manager', 'group', 'staff']);

            if ($request->has('status')) {
                if ($request->status === 'all_statuses') {
                    // Do nothing, show everything
                } elseif ($request->status !== 'All') {
                    $query->where('status', $request->status);
                } else {
                    $query->whereIn('status', [Loan::STATUS_ACTIVE, Loan::STATUS_APPROVED]);
                }
            } else {
                // Default view should only show approved/active loans
                $query->whereIn('status', [Loan::STATUS_ACTIVE, Loan::STATUS_APPROVED]);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('loan_id', 'LIKE', "%{$search}%")
                      ->orWhereHas('customer', function($cq) use ($search) {
                          $cq->where('full_name', 'LIKE', "%{$search}%")
                             ->orWhere('customer_code', 'LIKE', "%{$search}%");
                      });
                });
            }

            $loans = $query->paginate($request->input('per_page', 10));

            return response()->json([
                'status' => 'success',
                'data' => $loans->items(),
                'meta' => [
                    'current_page' => $loans->currentPage(),
                    'last_page' => $loans->lastPage(),
                    'total' => $loans->total(),
                    'per_page' => $loans->perPage(),
                    'stats' => [
                        'total_count' => Loan::whereIn('status', [Loan::STATUS_ACTIVE, Loan::STATUS_APPROVED])->count(),
                        'active_count' => Loan::whereIn('status', [Loan::STATUS_ACTIVE, Loan::STATUS_APPROVED])->count(),
                        'completed_count' => Loan::where('status', Loan::STATUS_COMPLETED)->count(),
                        'total_disbursed' => Loan::where('status', Loan::STATUS_ACTIVE)->sum('approved_amount'),
                        'total_outstanding' => Loan::where('status', Loan::STATUS_ACTIVE)->sum('outstanding_amount'),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch loans',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $loan = Loan::with(['customer', 'product', 'center', 'group', 'staff'])->findOrFail($id);
            return response()->json([
                'status' => 'success',
                'data' => $loan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Loan not found'
            ], 404);
        }
    }

    public function store(Request $request)
    {
        // Validation handles its own 422 response automatically
        $validated = $request->validate([
            'product_id' => 'required|exists:loan_products,id',
            'CSU_id' => 'required|exists:centers,id',
            'customer_id' => 'required|exists:customers,id',
            'group_id' => 'nullable|exists:groups,id',
            'request_amount' => 'required|numeric',
            'approved_amount' => 'required|numeric',
            'terms' => 'required|integer',
            'interest_rate' => 'required|numeric',
            'loan_step' => 'nullable|string',
            'service_charge' => 'nullable|numeric',
            'document_charge' => 'nullable|numeric',
            'guardian_nic' => 'required|string',
            'guardian_name' => 'required|string',
            'guardian_address' => 'required|string',
            'guardian_phone' => 'required|string',
            'guarantor1_name' => 'required|string',
            'guarantor1_nic' => 'required|string',
            'guarantor2_name' => 'nullable|string',
            'guarantor2_nic' => 'nullable|string',
            'witness1_id' => 'required|exists:staffs,staff_id|different:witness2_id',
            'witness2_id' => 'required|exists:staffs,staff_id|different:witness1_id',
        ]);

        // Check for existing active or pending loan of the same type for this customer
        $existingLoanQuery = \App\Models\Loan::where('customer_id', $validated['customer_id'])
            ->where('product_id', $validated['product_id'])
            ->whereNotIn('status', Loan::CLOSED_STATUSES);

        // If editing/resubmitting, exclude the current loan from the check
        if ($request->has('edit_id')) {
            $existingLoanQuery->where('id', '!=', $request->edit_id);
        }

        $existingLoan = $existingLoanQuery->first();

        if ($existingLoan) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer already has an active or pending loan of this type.',
                'errors' => [
                    'product_id' => ['Customer already has an ongoing loan of this type (' . $existingLoan->loan_id . ').']
                ]
            ], 422);
        }

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $validated) {
                // If we are editing an existing sent-back loan
                $loan = null;
                if ($request->has('edit_id')) {
                    $loan = Loan::find($request->edit_id);
                }

                if (!$loan) {
                    $loan = new Loan();
                    // Generate a new unique loan ID only for new loans
                    $loan->loan_id = 'LN-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
                    $loan->staff_id = auth()->id() ?? 1;
                }
                
                $loan->fill($validated);
                
                // Map guarantor and witness structured fields
                $loan->g1_details = [
                    'name' => $request->guarantor1_name,
                    'nic' => $request->guarantor1_nic
                ];
                $loan->g2_details = [
                    'name' => $request->guarantor2_name,
                    'nic' => $request->guarantor2_nic
                ];
                
                if ($request->witness1_id) {
                    $staff1 = \App\Models\Staff::find($request->witness1_id);
                    $loan->w1_details = [
                        'staff_id' => $request->witness1_id,
                        'name' => $staff1 ? $staff1->full_name : 'N/A'
                    ];
                }
                
                if ($request->witness2_id) {
                    $staff2 = \App\Models\Staff::find($request->witness2_id);
                    $loan->w2_details = [
                        'staff_id' => $request->witness2_id,
                        'name' => $staff2 ? $staff2->full_name : 'N/A'
                    ];
                }

                $loan->status = Loan::STATUS_PENDING_1ST;
                $loan->approval_level = 0;
                $loan->rejection_reason = null; // Clear reason on resubmission
                $loan->outstanding_amount = $validated['approved_amount'];
                $loan->save();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Loan application submitted successfully',
                    'data' => $loan
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to submit loan application: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function approve(Request $request, $id)
    {
        try {
            $loan = Loan::with(['customer', 'product', 'center.branch.manager', 'group', 'staff'])->findOrFail($id);
            $action = $request->input('action'); // 'approve', 'send_back', 'reject'
            
            // Get manager info for notification
            $user = auth()->user();
            $role = $user->getRoleNames()->first() ?? '';
            $formattedRole = ucwords(str_replace('_', ' ', $role)); // e.g. "Branch Manager"

            $staffName = null;
            if ($user->staff) {
                // If linked to a Staff record, use their real name
                $staffName = $user->staff->full_name ?? $user->staff->name_with_initial;
            } elseif (strpos($user->user_name, ' ') !== false) {
                 // If no staff record, use user_name ONLY if it looks like a name (has spaces)
                 // This filters out IDs like 'ST0002', 'admin', 'user1'
                 $staffName = $user->user_name;
            }

            // Construct display name: "Manager Name" or just "Manager"
            $displayName = $staffName ? trim($formattedRole . ' ' . $staffName) : $formattedRole;

            // Fallback if everything fails
            if (empty($displayName)) $displayName = 'System';

            $managerInfo = [
                'id' => $user->id,
                'name' => $displayName,
            ];
            
            $notificationAction = null;
            $reason = $request->input('reason');
            
            if ($action === 'approve') {
                $history = is_array($loan->approve_history) ? $loan->approve_history : [];
                $approver = [
                    'id' => auth()->id(),
                    'name' => auth()->user()->user_name,
                    'at' => now()->toDateTimeString()
                ];

                if ($loan->approval_level === 0) {
                    // First level approval
                    $history['first'] = $approver;
                    
                    // Logic: If loan amount > 200,000, need 2nd approval
                    if ($loan->approved_amount >= 200000) {
                        $loan->status = Loan::STATUS_PENDING_2ND;
                        $loan->approval_level = 1;
                        $notificationAction = LoanStatusNotification::ACTION_FIRST_APPROVAL;
                    } else {
                        $loan->status = Loan::STATUS_APPROVED;
                        $loan->approval_level = 2;
                        $notificationAction = LoanStatusNotification::ACTION_ACTIVATED;
                    }
                } elseif ($loan->approval_level === 1) {
                    // Second level approval
                    $history['second'] = $approver;
                    $loan->status = Loan::STATUS_APPROVED;
                    $loan->approval_level = 2;
                    $notificationAction = LoanStatusNotification::ACTION_ACTIVATED;
                }
                $loan->approve_history = $history;
            } elseif ($action === 'reject') {
                // Permanent rejection
                $loan->status = Loan::STATUS_REJECTED;
                $loan->rejection_reason = $reason;
                $notificationAction = LoanStatusNotification::ACTION_REJECTED;
            } else {
                // Send back for correction
                $loan->status = Loan::STATUS_SENT_BACK;
                $loan->rejection_reason = $reason;
                $loan->approval_level = 0; // Reset to 0 for resubmission cycle
                $notificationAction = LoanStatusNotification::ACTION_SENT_BACK;
            }
            
            $loan->save();
            
            // Send notification to the field officer who created/manages the loan
            if ($notificationAction && $loan->staff) {
                $loan->staff->notify(
                    new LoanStatusNotification(
                        $notificationAction,
                        $loan,
                        $managerInfo,
                        $reason
                    )
                );
            }

            // Send notification to the Branch Manager
            if ($notificationAction && $loan->center && $loan->center->branch && $loan->center->branch->manager) {
                $managerStaff = $loan->center->branch->manager;
                // Find the user associated with the manager staff record
                $managerUser = \App\Models\User::where('user_name', $managerStaff->staff_id)->first();
                
                // Notify if manager user exists and is not the same person as the field officer (to avoid duplicates)
                if ($managerUser && (!$loan->staff || $managerUser->id !== $loan->staff->id)) {
                    $managerUser->notify(
                        new LoanStatusNotification(
                            $notificationAction,
                            $loan,
                            $managerInfo,
                            $reason
                        )
                    );
                }
            }
            
            // Reload with relations for the response
            $loan->load(['customer', 'product', 'center.branch.manager', 'group', 'staff']);

            return response()->json([
                'status' => 'success',
                'message' => 'Loan status updated successfully',
                'data' => $loan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process loan approval',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function disburse(Request $request, $id)
    {
        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id) {
                $loan = Loan::with(['customer', 'product', 'center.branch'])->findOrFail($id);

                if ($loan->status !== Loan::STATUS_APPROVED) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Only approved loans can be disbursed.'
                    ], 422);
                }

                $user = auth()->user();

                // 1. Mark as Active/Disbursed
                $loan->status = Loan::STATUS_ACTIVE;
                
                // 2. Calculate and set due date fields
                $this->setLoanDueDateFields($loan);
                
                // 3. Ensure rental is calculated
                if (!$loan->rentel || $loan->rentel <= 0) {
                    $loan->rentel = $this->calculateRental($loan);
                }
                
                $loan->save();

                // 4. Create Initial Payment Record (Ledger)
                $this->createInitialPaymentRecord($loan);

                // 5. Create Financial Transaction (Outflow)
                // Use a default category 'loan_disbursement'
                $transaction = \App\Models\Transaction::create([
                    'staff_id' => $user->user_name,
                    'amount' => $loan->approved_amount,
                    'type' => 'outflow',
                    'category' => 'loan_disbursement',
                    'status' => 'completed',
                    'related_id' => $loan->id,
                    'timestamp' => now(),
                    'description' => "Loan Disbursement: #{$loan->loan_id} for {$loan->customer->full_name}"
                ]);

                // Record in BranchExpense (as a branch activity disbursement)
                \App\Models\BranchExpense::create([
                    'branch_id' => $loan->center->branch_id,
                    'transaction_id' => $transaction->id,
                    'type' => 'outflow',
                    'date' => now()->toDateString(),
                    'expense_type' => 'Loan Disbursement',
                    'medium' => 'Cash',
                    'description' => "Disbursement for Loan #{$loan->loan_id}",
                    'amount' => $loan->approved_amount,
                ]);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Loan disbursed successfully and activation completed.',
                    'data' => $loan
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to disburse loan: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $loan = Loan::findOrFail($id);

            // Prevent editing if loan is active (approved)
            if ($loan->status === Loan::STATUS_APPROVED || $loan->status === Loan::STATUS_ACTIVE) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot edit an active or approved loan.'
                ], 403);
            }

            // Reuse the same validation as store, but maybe some fields are not editable?
            // For simplicity, we can reuse similar validation or assume request is partial.
            // Typically, re-validation is good.
            $validated = $request->validate([
                'product_id' => 'sometimes|exists:loan_products,id',
                'CSU_id' => 'sometimes|exists:centers,id',
                'customer_id' => 'sometimes|exists:customers,id',
                'group_id' => 'nullable|exists:groups,id',
                'request_amount' => 'sometimes|numeric',
                'approved_amount' => 'sometimes|numeric',
                'terms' => 'sometimes|integer',
                'interest_rate' => 'sometimes|numeric',
                // Add other fields as 'sometimes'
            ]);

            $loan->update($request->all());

            return response()->json([
                'status' => 'success',
                'message' => 'Loan updated successfully',
                'data' => $loan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update loan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $loan = Loan::findOrFail($id);

            // Prevent deletion if loan is active (approved)
            if ($loan->status === Loan::STATUS_APPROVED || $loan->status === Loan::STATUS_ACTIVE) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot delete an active or approved loan.'
                ], 403);
            }

            $loan->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Loan deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete loan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export Loans to CSV.
     */
    public function export()
    {
        try {
            $loans = Loan::with(['customer', 'product', 'center', 'group'])->get();
            
            $headers = [
                "Content-type" => "text/csv",
                "Content-Disposition" => "attachment; filename=loans_" . date('Y-m-d_His') . ".csv",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0"
            ];

            $columns = [
                'ID', 'Loan ID', 'Customer Name', 'Customer Code', 'Product', 
                'Center', 'Group', 'Approved Amount', 'Outstanding Amount', 
                'Interest Rate', 'Terms', 'Status', 'Request Date'
            ];

            $callback = function() use ($loans, $columns) {
                $file = fopen('php://output', 'w');
                fputcsv($file, $columns);

                foreach ($loans as $loan) {
                    $row = [
                        $loan->id,
                        $loan->loan_id,
                        $loan->customer ? $loan->customer->full_name : 'N/A',
                        $loan->customer ? $loan->customer->customer_code : 'N/A',
                        $loan->product ? $loan->product->product_name : 'N/A',
                        $loan->center ? $loan->center->center_name : 'N/A',
                        $loan->group ? $loan->group->group_name : 'N/A',
                        $loan->approved_amount,
                        $loan->outstanding_amount,
                        $loan->interest_rate,
                        $loan->terms,
                        $loan->status,
                        $loan->created_at
                    ];

                    fputcsv($file, $row);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export loans: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import Loans from CSV.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ], [
            'file.mimes' => 'Only CSV or TXT files are allowed. Excel files are not supported directly.'
        ]);

        // Disable foreign key checks for bulk import (TEMPORARILY DISABLED FOR TESTING)
        // DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            $file = $request->file('file');
            $path = $file->getRealPath();
            
            if (!file_exists($path)) {
                 throw new \Exception("File not found at path: $path");
            }

            // Detect line endings and fix if necessary (Mac legacy vs Unix vs Windows)
            if (!ini_get("auto_detect_line_endings")) {
                ini_set("auto_detect_line_endings", '1');
            }

            $handle = fopen($path, 'r');
            // Check BOM
            $bom = fread($handle, 3);
            if ($bom != "\xEF\xBB\xBF") rewind($handle);

            // Find headers - skip empty lines at the beginning
            $headers = null;
            while (($firstRow = fgetcsv($handle)) !== false) {
                if (!empty(array_filter($firstRow))) {
                    $headers = $firstRow;
                    break;
                }
            }

            if (!$headers) {
                // Re-enable foreign key checks before early return (TEMPORARILY DISABLED FOR TESTING)
                // DB::statement('SET FOREIGN_KEY_CHECKS=1');
                fclose($handle);
                return response()->json(['status' => 'error', 'message' => 'The uploaded file appears to be empty or not a valid CSV.'], 400);
            }

            $headers = array_map(function ($h) {
                // Remove invisible chars (0-31, 127-255) to fix header mismatch issues
                $clean = preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', $h);
                return trim(strtolower(str_replace([' ', '-', '/'], '_', $clean)));
            }, $headers);

            $importCount = 0;
            $errorCount = 0;
            $errors = [];

            while (($row = fgetcsv($handle)) !== false) {
                // Skip empty rows
                if (empty(array_filter($row))) continue;

                // Pad or Trim row
                if (count($row) < count($headers)) {
                    $row = array_pad($row, count($headers), null);
                } else if (count($row) > count($headers)) {
                    $row = array_slice($row, 0, count($headers));
                }

                $data = array_combine($headers, $row);
                $rowNum = $importCount + $errorCount + 2; 

                // Process Row Transactionally
                // If one row fails, we log error and continue (Partial Import) OR fail all? 
                // Let's do Partial Import to allow valid rows to succeed.
                DB::beginTransaction();

                try {
                    $loanData = [];

                    // 1. Product Lookup
                    if (empty($data['product'])) throw new \Exception("Product name required");
                    $product = \App\Models\LoanProduct::where('product_name', trim($data['product']))->first();
                    if (!$product) throw new \Exception("Product '" . $data['product'] . "' not found");
                    $loanData['product_id'] = $product->id;

                    // 2. Center Lookup
                    if (empty($data['center'])) throw new \Exception("Center code required");
                    $centerVal = trim($data['center']);
                    $center = \App\Models\Center::where('CSU_id', $centerVal)
                        ->orWhere('id', $centerVal)
                        ->orWhere('center_name', 'like', "%{$centerVal}%")
                        ->first();
                    if (!$center) throw new \Exception("Center '$centerVal' not found");
                    $loanData['CSU_id'] = $center->id;

                    // 3. Customer Lookup
                    if (empty($data['customer'])) throw new \Exception("Customer NIC required");
                    $nic = trim($data['customer']);
                    $customer = \App\Models\Customer::where('customer_code', $nic)->first();
                    if (!$customer) throw new \Exception("Customer '$nic' not found");
                    $loanData['customer_id'] = $customer->id;

                    // 4. Duplicate Check
                    $existingLoan = Loan::where('customer_id', $customer->id)
                        ->where('product_id', $product->id)
                        ->whereIn('status', Loan::ACTIVE_STATUSES)
                        ->exists();
                    if ($existingLoan) throw new \Exception("Customer asking for '{$product->product_name}' already has active loan");

                    // 5. Group Lookup
                    if (!empty($data['group'])) {
                        $grpVal = trim($data['group']);
                        $group = \App\Models\Group::where('center_id', $center->id)
                            ->where(function($q) use ($grpVal) {
                                $q->where('group_name', $grpVal)->orWhere('id', $grpVal);
                            })->first();
                        if ($group) $loanData['group_id'] = $group->id;
                    }

                    // 6. Witnesses (Staff Codes)
                    $w1Code = trim($data['witness1'] ?? '');
                    $w2Code = trim($data['witness2'] ?? '');

                    if (!$w1Code || !$w2Code) throw new \Exception("Witnesses required");
                    if ($w1Code === $w2Code) throw new \Exception("Witnesses must be different");

                    $staff1 = \App\Models\Staff::where('staff_id', $w1Code)->first();
                    $staff2 = \App\Models\Staff::where('staff_id', $w2Code)->first();

                    if (!$staff1) throw new \Exception("Witness 1 ($w1Code) not found");
                    if (!$staff2) throw new \Exception("Witness 2 ($w2Code) not found");

                    $loanData['witness1_id'] = $staff1->id;
                    $loanData['witness2_id'] = $staff2->id;

                    // 7. Auto-Generate Loan ID if missing
                    $loanId = !empty($data['loan_id']) ? trim($data['loan_id']) : null;
                    if ($loanId && Loan::where('loan_id', $loanId)->exists()) {
                         throw new \Exception("Loan ID '$loanId' duplicates existing loan");
                    }
                    if (!$loanId) {
                         $loanId = 'LN-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
                    }
                    $loanData['loan_id'] = $loanId;

                    // 8. Financials
                    $loanData['request_amount'] = floatval($data['request_amount'] ?? 0);
                    $loanData['approved_amount'] = floatval($data['approved_amount'] ?? 0);
                    $loanData['outstanding_amount'] = $loanData['approved_amount'];
                    $loanData['terms'] = intval($data['terms'] ?? 12);
                    $loanData['interest_rate'] = floatval($data['interest_rate'] ?? 0);

                    // JSON Details
                    $loanData['g1_details'] = ['name' => $data['guarantor1_name'] ?? 'N/A', 'nic' => $data['guarantor1_nic'] ?? 'N/A'];
                    $loanData['g2_details'] = ['name' => $data['guarantor2_name'] ?? 'N/A', 'nic' => $data['guarantor2_nic'] ?? 'N/A'];
                    $loanData['w1_details'] = ['staff_id' => $staff1->id, 'name' => $staff1->full_name];
                    $loanData['w2_details'] = ['staff_id' => $staff2->id, 'name' => $staff2->full_name];

                    $loanData['guardian_nic'] = $data['guardian_nic'] ?? 'N/A';
                    $loanData['guardian_name'] = $data['guardian_name'] ?? 'N/A';
                    $loanData['guardian_address'] = $data['guardian_address'] ?? 'N/A';
                    $loanData['guardian_phone'] = $data['guardian_phone'] ?? 'N/A';
                    
                    $loanData['service_charge'] = floatval($data['service_charge'] ?? 0);
                    $loanData['document_charge'] = floatval($data['document_charge'] ?? 0);
                    $loanData['loan_step'] = $data['loan_step'] ?? null;
                    
                    // Support status from CSV (default: pending_1st)
                    $csvStatus = strtolower(trim($data['status'] ?? ''));
                    if ($csvStatus === 'active') {
                        $loanData['status'] = Loan::STATUS_ACTIVE;
                        $loanData['approval_level'] = 2; // Fully approved
                    } elseif ($csvStatus === 'approved') {
                        $loanData['status'] = Loan::STATUS_APPROVED;
                        $loanData['approval_level'] = 2;
                    } elseif ($csvStatus === 'closed' || $csvStatus === 'completed') {
                        $loanData['status'] = Loan::STATUS_COMPLETED;
                        $loanData['approval_level'] = 2;
                        $loanData['outstanding_amount'] = 0; // Completed loans have zero outstanding
                    } else {
                        $loanData['status'] = Loan::STATUS_PENDING_1ST;
                        $loanData['approval_level'] = 0;
                    }
                    
                    $loanData['staff_id'] = auth()->id() ?? 1;

                    $loan = Loan::create($loanData);
                    
                    // If status is Active, set up activation fields and create payment record
                    if ($loan->status === Loan::STATUS_ACTIVE) {
                        // Calculate rental
                        $loan->rentel = $this->calculateRental($loan);
                        
                        // Set due date fields
                        $this->setLoanDueDateFields($loan);
                        
                        $loan->save();
                        
                        // Create initial payment record (ledger entry)
                        $this->createInitialPaymentRecord($loan);
                    }
                    
                    DB::commit(); // Commit this row
                    $importCount++;

                } catch (\Exception $e) {
                    DB::rollBack(); // Rollback this row only
                    $errorCount++;
                    $errors[] = "Row $rowNum: " . $e->getMessage();
                    \Illuminate\Support\Facades\Log::error("Loan Import Row $rowNum Failed: " . $e->getMessage());
                }
            }

            fclose($handle);

            // Re-enable foreign key checks after import (TEMPORARILY DISABLED FOR TESTING)
            // DB::statement('SET FOREIGN_KEY_CHECKS=1');

            if ($importCount > 0) {
                 return response()->json([
                    'status' => 'success',
                    'message' => "Imported $importCount loans successfully." . ($errorCount > 0 ? " ($errorCount failed)" : ""),
                    'errors' => $errors
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => "No loans imported. $errorCount errors found.",
                    'errors' => $errors
                ], 422); // Unprocessable Entity
            }


        } catch (\Exception $e) {
            // Re-enable foreign key checks even on failure (TEMPORARILY DISABLED FOR TESTING)
            // DB::statement('SET FOREIGN_KEY_CHECKS=1');
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Critical Import Failure: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Create the initial opening balance record in customer_loan_payment table
     */
    private function createInitialPaymentRecord($loan)
    {
        \App\Models\CustomerLoanPayment::create([
            'customer_id' => $loan->customer_id,
            'loan_id' => $loan->id,
            'receipt_id' => null,
            'last_payment_amount' => 0,
            'last_payment_date' => now(),
            'full_balance' => $loan->approved_amount,
            'current_balance_amount' => $loan->approved_amount,
            'current_capital_balance' => $loan->approved_amount,
            'current_balance_interest' => 0,
            'interest_amount' => 0,
            'rental_amount' => $loan->rentel,
            'total_due' => $loan->rentel,
            'remained_due' => $loan->rentel,
            'arrears' => 0,
            'arrears_age' => 0,
        ]);
    }

    /**
     * Helper to calculate the rental amount for a loan
     */
    private function calculateRental($loan)
    {
        $principal = $loan->approved_amount;
        $interestRate = $loan->interest_rate / 100;
        $terms = $loan->terms;

        if ($terms <= 0) return 0;

        // Formula: (Principal + Total Interest) / Number of Terms
        $totalInterest = $principal * $interestRate;
        return round(($principal + $totalInterest) / $terms, 2);
    }

    /**
     * Helper to calculate and set due date fields when loan becomes ACTIVE.
     * 
     * Business Rules (Company Standard):
     * - Fixed due days: 1, 8, 15, 22
     * - First due date uses skip-next-due logic based on activation date
     * 
     * Activation Windows → First Due:
     * - 1–7   → 15
     * - 8–14  → 22
     * - 15–21 → Next month 1
     * - 22–end of month → Next month 8
     */
    private function setLoanDueDateFields($loan)
    {
        try {
            $dueDateService = new LoanDueDateService();
            $activationDate = Carbon::now();
            
            // Get term type from product (default to Weekly)
            $termType = optional($loan->product)->term_type ?? 'Weekly';
            
            // Calculate first due date and assigned due day
            $result = $dueDateService->calculateFirstDueDate($activationDate, $termType);
            
            // Set the loan fields
            $loan->activation_date = $activationDate;
            $loan->first_due_date = $result['first_due_date'];
            $loan->due_day = $result['due_day'];
            
            \Log::info("Loan due date fields set", [
                'loan_id' => $loan->loan_id,
                'activation_date' => $activationDate->format('Y-m-d'),
                'first_due_date' => $result['first_due_date']->format('Y-m-d'),
                'due_day' => $result['due_day'],
                'term_type' => $termType,
            ]);
        } catch (\Exception $e) {
            \Log::error("Failed to set due date fields for loan", [
                'loan_id' => $loan->loan_id ?? $loan->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - allow loan activation to proceed even if due date calc fails
            // The system will fall back to legacy logic for collections
        }
    }
}

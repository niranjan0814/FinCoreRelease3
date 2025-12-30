<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Loan::with(['customer', 'product', 'center', 'group']);

            if ($request->has('status') && $request->status !== 'All') {
                $query->where('status', $request->status);
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
                        'total_count' => Loan::count(),
                        'active_count' => Loan::where('status', 'Active')->count(),
                        'total_disbursed' => Loan::sum('approved_amount'),
                        'total_outstanding' => Loan::sum('outstanding_amount'),
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
        try {
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
            ]);

            // Generate a unique loan ID
            $loanId = 'LN-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
            
            $loan = new Loan();
            $loan->fill($validated);
            $loan->loan_id = $loanId;
            $loan->status = 'pending_1st';
            $loan->approval_level = 0;
            $loan->staff_id = auth()->id() ?? 1; // Fallback for testing
            $loan->outstanding_amount = $validated['approved_amount'];
            $loan->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Loan application submitted successfully',
                'data' => $loan
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to submit loan application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function approve(Request $request, $id)
    {
        try {
            $loan = Loan::findOrFail($id);
            $action = $request->input('action'); // 'approve' or 'send_back'
            
            if ($action === 'approve') {
                if ($loan->approval_level === 0) {
                    // First level approval
                    // Logic: If loan amount > 200,000, need 2nd approval
                    if ($loan->approved_amount > 200000) {
                        $loan->status = 'pending_2nd';
                        $loan->approval_level = 1;
                    } else {
                        $loan->status = 'approved';
                        $loan->approval_level = 2; // Fully approved
                    }
                } elseif ($loan->approval_level === 1) {
                    // Second level approval
                    $loan->status = 'approved';
                    $loan->approval_level = 2;
                }
            } else {
                $loan->status = 'sent_back';
                // Keeps the approval level at its current state or could reset
            }
            
            $loan->save();

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
}

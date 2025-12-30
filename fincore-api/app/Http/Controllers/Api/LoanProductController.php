<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LoanProduct;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class LoanProductController extends Controller
{
    /**
     * Display a listing of loan products with optional filtering.
     * Status Code: 2000
     * HTTP Code: 200 OK
     */
    public function index(Request $request)
    {
        try {
            $query = LoanProduct::with('customer');

            // Apply filters if provided
            if ($request->has('product_name')) {
                $query->where('product_name', 'LIKE', '%' . $request->product_name . '%');
            }

            if ($request->has('term_type')) {
                $query->where('term_type', $request->term_type);
            }

            if ($request->has('min_interest_rate')) {
                $query->where('interest_rate', '>=', $request->min_interest_rate);
            }

            if ($request->has('max_interest_rate')) {
                $query->where('interest_rate', '<=', $request->max_interest_rate);
            }

            if ($request->has('min_loan_amount')) {
                $query->where('loan_amount', '>=', $request->min_loan_amount);
            }

            if ($request->has('max_loan_amount')) {
                $query->where('loan_amount', '<=', $request->max_loan_amount);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $loanProducts = $query->get();

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Loan list fetched successfully',
                'data' => $loanProducts
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve loan products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created loan product.
     * Status Code: 2010
     * HTTP Code: 201 Created
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_name' => 'required|string|max:255|unique:loan_products,product_name',
                'product_details' => 'nullable|string',
                'term_type' => 'required|string|max:255',
                'regacine' => 'nullable|string|max:255',
                'interest_rate' => 'required|numeric|min:0|max:100',
                'loan_limited_amount' => 'nullable|numeric|min:0',
                'loan_amount' => 'required|numeric|min:0',
                'loan_term' => 'required|integer|min:1',
                'customer_age_limited' => 'nullable|integer|min:18|max:100',
                'customer_monthly_income' => 'nullable|numeric|min:0',
                'guarantor_monthly_income' => 'nullable|numeric|min:0',
            ]);

            // Set default status as pending for approval
            $validated['status'] = 'pending_1st';
            $validated['approval_level'] = 0;

            $loanProduct = LoanProduct::create($validated);

            return response()->json([
                'status' => 'success',
                'status_code' => 2010,
                'message' => 'Loan created successfully',
                'data' => $loanProduct
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create loan product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified loan product.
     * Status Code: 2000
     * HTTP Code: 200 OK
     */
    public function show($id)
    {
        try {
            $loanProduct = LoanProduct::findOrFail($id);

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Loan details fetched successfully',
                'data' => $loanProduct
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Loan product not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve loan product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get loan products by customer ID.
     * Status Code: 2000
     * HTTP Code: 200 OK
     */
    public function getByCustomerId($customer_id)
    {
        try {
            // Assuming you'll add customer_id to loan_products table later
            $loanProducts = LoanProduct::where('customer_id', $customer_id)->get();

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Customer loan details fetched',
                'data' => $loanProducts
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve customer loan products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified loan product.
     * Status Code: 2000
     * HTTP Code: 200 OK
     */
    public function update(Request $request, $id)
    {
        try {
            $loanProduct = LoanProduct::findOrFail($id);

            $validated = $request->validate([
                'product_name' => 'sometimes|required|string|max:255|unique:loan_products,product_name,' . $id,
                'product_details' => 'nullable|string',
                'term_type' => 'sometimes|required|string|max:255',
                'regacine' => 'nullable|string|max:255',
                'interest_rate' => 'sometimes|required|numeric|min:0|max:100',
                'loan_limited_amount' => 'nullable|numeric|min:0',
                'loan_amount' => 'sometimes|required|numeric|min:0',
                'loan_term' => 'sometimes|required|integer|min:1',
                'customer_age_limited' => 'nullable|integer|min:18|max:100',
                'customer_monthly_income' => 'nullable|numeric|min:0',
                'guarantor_monthly_income' => 'nullable|numeric|min:0',
            ]);

            $loanProduct->update($validated);

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Loan updated successfully',
                'data' => $loanProduct
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Loan product not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update loan product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process approval/rejection for a loan product
     */
    public function approve(Request $request, $id)
    {
        try {
            $loanProduct = LoanProduct::findOrFail($id);
            $action = $request->input('action'); // 'approve' or 'send_back'
            
            if ($action === 'approve') {
                if ($loanProduct->approval_level === 0) {
                    // First level approval
                    if ($loanProduct->loan_amount > 200000) {
                        $loanProduct->status = 'pending_2nd';
                        $loanProduct->approval_level = 1;
                    } else {
                        $loanProduct->status = 'approved';
                        $loanProduct->approval_level = 2; // Fully approved
                    }
                } elseif ($loanProduct->approval_level === 1) {
                    // Second level approval
                    $loanProduct->status = 'approved';
                    $loanProduct->approval_level = 2;
                }
            } else {
                $loanProduct->status = 'sent_back';
                // Keeps the approval level at its current state or could reset to 0
            }
            
            $loanProduct->save();

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Loan product status updated successfully',
                'data' => $loanProduct
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Loan product not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process loan approval',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel/Delete the specified loan product.
     * Status Code: 2000
     * HTTP Code: 200 OK
     */
    public function destroy($id)
    {
        try {
            $loanProduct = LoanProduct::findOrFail($id);
            $loanProduct->delete();

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Loan cancelled successfully'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Loan product not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to cancel loan product',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\InvestmentProduct;
use Illuminate\Validation\Rule;

class InvestmentProductController extends Controller
{
    /**
     * Display a listing of investment products with optional filtering.
     * Status Code: 2000
     * HTTP Code: 200 OK
     */
    public function index(Request $request)
    {
        try {
            $query = InvestmentProduct::query();

            // Apply filters if provided
            if ($request->has('name')) {
                $query->where('name', 'LIKE', '%' . $request->name . '%');
            }

            if ($request->has('min_interest_rate')) {
                $query->where('interest_rate', '>=', $request->min_interest_rate);
            }

            if ($request->has('max_interest_rate')) {
                $query->where('interest_rate', '<=', $request->max_interest_rate);
            }

            if ($request->has('age_limited')) {
                $query->where('age_limited', $request->age_limited);
            }

            $investmentProducts = $query->get();

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Investment products fetched successfully',
                'data' => $investmentProducts
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve investment products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created investment product.
     * Status Code: 2010
     * HTTP Code: 201 Created
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100|unique:investment_products,name',
                'interest_rate' => 'required|numeric|min:0|max:100',
                'age_limited' => 'nullable|integer',
            ]);

            $investmentProduct = InvestmentProduct::create($validated);

            return response()->json([
                'status' => 'success',
                'status_code' => 2010,
                'message' => 'Investment product created successfully',
                'data' => $investmentProduct
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
                'message' => 'Failed to create investment product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified investment product.
     * Status Code: 2000
     * HTTP Code: 200 OK
     */
    public function show($id)
    {
        try {
            $investmentProduct = InvestmentProduct::findOrFail($id);

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Investment product details fetched successfully',
                'data' => $investmentProduct
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Investment product not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve investment product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified investment product.
     * Status Code: 2000
     * HTTP Code: 200 OK
     */
    public function update(Request $request, $id)
    {
        try {
            $investmentProduct = InvestmentProduct::findOrFail($id);

            $validated = $request->validate([
                'name' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('investment_products', 'name')->ignore($investmentProduct->id)
                ],
                'interest_rate' => 'sometimes|required|numeric|min:0|max:100',
                'age_limited' => 'nullable|integer',
            ]);

            $investmentProduct->update($validated);

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Investment product updated successfully',
                'data' => $investmentProduct
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Investment product not found'
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
                'message' => 'Failed to update investment product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified investment product.
     * Status Code: 2000
     * HTTP Code: 200 OK
     */
    public function destroy($id)
    {
        try {
            $investmentProduct = InvestmentProduct::findOrFail($id);
            $investmentProduct->delete();

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Investment product deleted successfully'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Investment product not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete investment product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Filter investment products with advanced filters.
     * Status Code: 2000
     * HTTP Code: 200 OK
     */
    public function filter(Request $request)
    {
        try {
            $query = InvestmentProduct::query();

            // Name filter (partial match)
            if ($request->has('name')) {
                $query->where('name', 'LIKE', '%' . $request->name . '%');
            }

            // Interest rate range filter
            if ($request->has('min_interest_rate')) {
                $query->where('interest_rate', '>=', $request->min_interest_rate);
            }

            if ($request->has('max_interest_rate')) {
                $query->where('interest_rate', '<=', $request->max_interest_rate);
            }

            // Age limited filter
            if ($request->has('age_limited')) {
                $query->where('age_limited', $request->age_limited);
            }

            // Age range filter
            if ($request->has('min_age')) {
                $query->where('age_limited', '>=', $request->min_age);
            }

            if ($request->has('max_age')) {
                $query->where('age_limited', '<=', $request->max_age);
            }

            // Date range filter
            if ($request->has('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            // Sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $investmentProducts = $query->get();

            return response()->json([
                'status' => 'success',
                'status_code' => 2000,
                'message' => 'Investment products filter applied successfully',
                'data' => $investmentProducts,
                'count' => $investmentProducts->count()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to filter investment products',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

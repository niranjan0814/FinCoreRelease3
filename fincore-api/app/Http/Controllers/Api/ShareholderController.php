<?php

namespace App\Http\Controllers\Api;

use App\Models\Shareholder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShareholderController extends BaseController
{
    /**
     * Display a listing of the shareholders.
     */
    public function index()
    {
        try {
            $shareholders = Shareholder::all();
            return $this->success($shareholders, 'Shareholders fetched successfully');
        } catch (\Exception $e) {
            return $this->serverError($e->getMessage());
        }
    }

    /**
     * Store a newly created shareholder in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'shares' => 'required|integer|min:0',
            'percentage' => 'required|numeric|min:0|max:100',
            'total_investment' => 'required|numeric|min:0',
            'nic' => 'nullable|string|max:20',
            'contact' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        try {
            $shareholder = Shareholder::create($request->all());
            return $this->success($shareholder, 'Shareholder created successfully', 201);
        } catch (\Exception $e) {
            return $this->serverError($e->getMessage());
        }
    }

    /**
     * Display the specified shareholder.
     */
    public function show(Shareholder $shareholder)
    {
        return $this->success($shareholder, 'Shareholder details fetched successfully');
    }

    /**
     * Update the specified shareholder in storage.
     */
    public function update(Request $request, Shareholder $shareholder)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'shares' => 'sometimes|required|integer|min:0',
            'percentage' => 'sometimes|required|numeric|min:0|max:100',
            'total_investment' => 'sometimes|required|numeric|min:0',
            'nic' => 'nullable|string|max:20',
            'contact' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        try {
            $shareholder->update($request->all());
            return $this->success($shareholder, 'Shareholder updated successfully');
        } catch (\Exception $e) {
            return $this->serverError($e->getMessage());
        }
    }

    /**
     * Remove the specified shareholder from storage.
     */
    public function destroy(Shareholder $shareholder)
    {
        try {
            $shareholder->delete();
            return $this->success(null, 'Shareholder deleted successfully');
        } catch (\Exception $e) {
            return $this->serverError($e->getMessage());
        }
    }
}

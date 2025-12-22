<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');
        $staffDetailId = $this->getStaffDetailId($userId);

        return [
            'user_name' => 'sometimes|string|max:255|unique:users,user_name,' . $userId,
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $userId,
            'digital_signature' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'avatar' => 'nullable|string|max:255',
            
            // Staff details (optional)
            'staff_details' => 'nullable|array',
            'staff_details.employee_id' => 'nullable|string|max:50|unique:staff_details,employee_id,' . $staffDetailId,
            'staff_details.designation' => 'nullable|string|max:100',
            'staff_details.department' => 'nullable|string|max:100',
            'staff_details.phone' => 'nullable|string|max:20',
            'staff_details.joining_date' => 'nullable|date',
            'staff_details.leaving_date' => 'nullable|date|after_or_equal:staff_details.joining_date',
            'staff_details.salary' => 'nullable|numeric|min:0',
            'staff_details.employment_type' => 'nullable|in:permanent,contract,probation,intern',
            'staff_details.reporting_to' => 'nullable|string|max:50',
            'staff_details.bank_name' => 'nullable|string|max:100',
            'staff_details.bank_account_number' => 'nullable|string|max:50',
            'staff_details.pan_number' => 'nullable|string|max:20',
            'staff_details.aadhar_number' => 'nullable|string|max:20',
            'staff_details.uan_number' => 'nullable|string|max:50',
            'staff_details.address' => 'nullable|string|max:500',
            'staff_details.emergency_contact_name' => 'nullable|string|max:100',
            'staff_details.emergency_contact_phone' => 'nullable|string|max:20',
            'staff_details.notes' => 'nullable|string',
            'staff_details.custom_fields' => 'nullable|array',
            
            // Roles and permissions
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ];
    }

    /**
     * Get staff detail ID for unique validation
     */
    private function getStaffDetailId($userId)
    {
        $staffDetail = \App\Models\StaffDetail::where('user_id', $userId)->first();
        return $staffDetail ? $staffDetail->id : 'NULL';
    }
}
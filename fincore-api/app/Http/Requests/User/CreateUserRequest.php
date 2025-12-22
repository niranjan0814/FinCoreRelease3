<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class CreateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_name' => 'required|string|max:255|unique:users,user_name',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'digital_signature' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'avatar' => 'nullable|string|max:255',
            
            // Staff details (optional)
            'staff_details' => 'nullable|array',
            'staff_details.employee_id' => 'nullable|string|max:50|unique:staff_details,employee_id',
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

    public function messages(): array
    {
        return [
            'user_name.required' => 'Username is required',
            'user_name.unique' => 'This username is already taken',
            'email.required' => 'Email is required',
            'email.unique' => 'This email is already registered',
            'password.required' => 'Password is required',
            'password.min' => 'Password must be at least 8 characters',
            'password.confirmed' => 'Password confirmation does not match',
            'staff_details.employee_id.unique' => 'This employee ID already exists',
        ];
    }
}
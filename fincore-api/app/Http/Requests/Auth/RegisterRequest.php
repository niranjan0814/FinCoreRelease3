<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
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
            'avatar' => 'nullable|string|max:255',
            
            // Staff details (optional)
            'staff_details.employee_id' => 'nullable|string|max:50|unique:staff_details,employee_id',
            'staff_details.designation' => 'nullable|string|max:100',
            'staff_details.department' => 'nullable|string|max:100',
            'staff_details.phone' => 'nullable|string|max:20',
            'staff_details.joining_date' => 'nullable|date',
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
        ];
    }
}
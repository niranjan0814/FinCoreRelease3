<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');
        $currentUser = auth()->user();

        $rules = [
            'new_password' => 'required|string|min:8|confirmed',
        ];

        // Only require current password if user is changing their own password
        if ($currentUser && $currentUser->id == $userId) {
            $rules['current_password'] = 'required|string|min:8';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Current password is required',
            'new_password.required' => 'New password is required',
            'new_password.min' => 'New password must be at least 8 characters',
            'new_password.confirmed' => 'New password confirmation does not match',
        ];
    }
}
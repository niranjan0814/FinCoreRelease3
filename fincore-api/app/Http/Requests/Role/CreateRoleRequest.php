<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class CreateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:roles,name',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'required|in:super_admin,admin,manager,staff',
            'hierarchy' => 'required|integer|min:1|max:1000',
            'guard_name' => 'nullable|string|max:50',
            'is_default' => 'boolean',
            'is_editable' => 'boolean',
            'restrictions' => 'nullable|array',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ];
    }
}
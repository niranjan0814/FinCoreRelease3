<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('role');

        return [
            'name' => 'sometimes|string|max:255|unique:roles,name,' . $roleId,
            'display_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'level' => 'sometimes|in:super_admin,admin,manager,staff',
            'hierarchy' => 'sometimes|integer|min:1|max:1000',
            'guard_name' => 'nullable|string|max:50',
            'is_default' => 'boolean',
            'is_editable' => 'boolean',
            'restrictions' => 'nullable|array',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ];
    }
}
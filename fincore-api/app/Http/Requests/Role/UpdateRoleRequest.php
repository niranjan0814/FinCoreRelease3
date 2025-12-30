<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('roles.edit');
    }

    public function rules(): array
    {
        $roleId = $this->route('role');

        return [
            'name' => 'sometimes|string|max:255|unique:roles,name,' . $roleId,
            'display_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'level' => 'sometimes|string|max:50',
            'hierarchy' => 'sometimes|integer|min:2|max:10000',
            'guard_name' => 'nullable|string|max:50',
            'is_default' => 'boolean',
            'is_editable' => 'boolean',
            'restrictions' => 'nullable|array',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
            // New: permission_matrix for dynamic permission creation
            'permission_matrix' => 'nullable|array',
            'permission_matrix.*.module' => 'required_with:permission_matrix|string',
            'permission_matrix.*.action' => 'required_with:permission_matrix|string',
        ];
    }
}
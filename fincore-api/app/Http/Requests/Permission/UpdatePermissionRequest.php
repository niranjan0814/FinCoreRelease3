<?php

namespace App\Http\Requests\Permission;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $permissionId = $this->route('permission');

        return [
            'name' => 'sometimes|string|max:255|unique:permissions,name,' . $permissionId,
            'display_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'permission_group_id' => 'nullable|exists:permission_groups,id',
            'module' => 'nullable|string|max:100',
            'guard_name' => 'nullable|string|max:50',
            'is_core' => 'boolean',
            'order' => 'integer|min:0',
            'metadata' => 'nullable|array',
        ];
    }
}
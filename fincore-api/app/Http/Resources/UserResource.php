<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_name' => $this->user_name,
            'email' => $this->email,
            'digital_signature' => $this->digital_signature,
            'is_active' => $this->is_active,
            'avatar' => $this->avatar,
            'avatar_url' => $this->avatar_url,
            'last_login_at' => $this->last_login_at,
            'last_login_ip' => $this->last_login_ip,
            'failed_login_attempts' => $this->failed_login_attempts,
            'is_locked' => $this->is_locked,
            'has_two_factor' => $this->has_two_factor,
            'two_factor_confirmed_at' => $this->two_factor_confirmed_at,
            'locked_until' => $this->locked_until,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            
            // Computed attributes
            'initials' => $this->initials,
            'full_name' => $this->full_name,
            
            // Staff details relationship
            'staff_detail' => $this->whenLoaded('staffDetail', function () {
                return $this->staffDetail ? [
                    'id' => $this->staffDetail->id,
                    'employee_id' => $this->staffDetail->employee_id,
                    'designation' => $this->staffDetail->designation,
                    'department' => $this->staffDetail->department,
                    'phone' => $this->staffDetail->phone,
                    'joining_date' => $this->staffDetail->joining_date,
                    'leaving_date' => $this->staffDetail->leaving_date,
                    'salary' => $this->staffDetail->salary,
                    'employment_type' => $this->staffDetail->employment_type,
                    'employment_status' => $this->staffDetail->employment_status,
                    'reporting_to' => $this->staffDetail->reporting_to,
                    'bank_name' => $this->staffDetail->bank_name,
                    'bank_account_number' => $this->staffDetail->bank_account_number,
                    'pan_number' => $this->staffDetail->pan_number,
                    'aadhar_number' => $this->staffDetail->aadhar_number,
                    'uan_number' => $this->staffDetail->uan_number,
                    'address' => $this->staffDetail->address,
                    'emergency_contact_name' => $this->staffDetail->emergency_contact_name,
                    'emergency_contact_phone' => $this->staffDetail->emergency_contact_phone,
                    'notes' => $this->staffDetail->notes,
                    'custom_fields' => $this->staffDetail->custom_fields,
                    'created_at' => $this->staffDetail->created_at,
                    'updated_at' => $this->staffDetail->updated_at,
                ] : null;
            }),
            
            // Roles relationship
            'roles' => $this->whenLoaded('roles', function () {
                return $this->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'display_name' => $role->display_name_formatted,
                        'description' => $role->description,
                        'level' => $role->level,
                        'hierarchy' => $role->hierarchy,
                        'is_system' => $role->is_system,
                        'is_default' => $role->is_default,
                        'is_editable' => $role->is_editable,
                        'guard_name' => $role->guard_name,
                        'created_at' => $role->created_at,
                        'updated_at' => $role->updated_at,
                    ];
                });
            }),
            
            // Permissions relationship
            'permissions' => $this->whenLoaded('permissions', function () {
                return $this->permissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'display_name' => $permission->display_name,
                        'description' => $permission->description,
                        'module' => $permission->module,
                        'guard_name' => $permission->guard_name,
                        'is_core' => $permission->is_core,
                        'created_at' => $permission->created_at,
                        'updated_at' => $permission->updated_at,
                    ];
                });
            }),
            
            // Counts (when counted)
            'roles_count' => $this->whenCounted('roles', $this->roles_count),
            'permissions_count' => $this->whenCounted('permissions', $this->permissions_count),
            
            // Permission arrays
            'all_permissions' => $this->when($request->has('include_permissions'), function () {
                return $this->getAllPermissionNames();
            }),
            
            'role_names' => $this->when($request->has('include_role_names'), function () {
                return $this->getRoleNamesArray();
            }),
            
            'direct_permissions' => $this->when($request->has('include_direct_permissions'), function () {
                return $this->getDirectPermissionNames();
            }),
            
            // Boolean flags
            'is_super_admin' => $this->when($request->has('include_flags'), function () {
                return $this->isSuperAdmin();
            }),
            
            'is_admin' => $this->when($request->has('include_flags'), function () {
                return $this->isAdmin();
            }),
        ];
    }

    /**
     * Customize the response for a request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Http\JsonResponse  $response
     * @return void
     */
    public function withResponse($request, $response)
    {
        $data = $response->getData(true);
        
        // Add pagination meta if exists
        if (isset($data['meta'])) {
            $data['pagination'] = $data['meta'];
            unset($data['meta']);
        }
        
        $response->setData($data);
    }
}
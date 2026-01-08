<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\StaffSession;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get today's session for this user
        $todaySession = StaffSession::where('user_id', $this->id)
            ->where('date', now()->toDateString())
            ->latest('login_at')
            ->first();

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
            'role_name' => $this->roles->first()?->display_name ?? 'Staff',
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            
            // Branch Information
            'branch' => $this->staff && $this->staff->branch ? [
                'id' => $this->staff->branch->id,
                'name' => $this->staff->branch->branch_name,
            ] : null,
            'branch_id' => $this->staff ? $this->staff->branch_id : null,
            'staff_id' => $this->user_name,
            
            // Contact & Info Fallbacks (from staff if staffDetail not loaded)
            'phone' => $this->staffDetail ? $this->staffDetail->phone : ($this->staff ? $this->staff->contact_no : null),
            'address' => $this->staffDetail ? $this->staffDetail->address : ($this->staff ? $this->staff->address : null),
            
            // Computed attributes
            'initials' => $this->initials,
            'full_name' => $this->full_name,
            'display_name' => $this->user_name . ' - ' . ($this->staff ? $this->staff->full_name : $this->user_name),
            
            // Today's session data for manager actions
            'today_session' => $todaySession ? [
                'id' => $todaySession->id,
                'date' => $todaySession->date->format('Y-m-d'),
                'login_at' => $todaySession->login_at?->format('H:i:s'),
                'logout_at' => $todaySession->logout_at?->format('H:i:s'),
                'logout_type' => $todaySession->logout_type,
                'status' => $todaySession->status,
                'worked_minutes' => $todaySession->worked_minutes ?? 0,
                'attendance_status' => $todaySession->attendance_status,
                'auto_logged_out' => $todaySession->auto_logged_out,
                'remarks' => $todaySession->remarks,
                'approved_by' => $todaySession->approved_by,
                'approved_at' => $todaySession->approved_at,
            ] : null,
            
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
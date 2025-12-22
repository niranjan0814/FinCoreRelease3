<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\PermissionGroup;
use App\Models\StaffDetail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Clear cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        DB::beginTransaction();

        try {
            // Create permission groups
            $groups = [
                ['name' => 'User Management', 'slug' => 'user-management', 'icon' => 'users', 'color' => 'blue'],
                ['name' => 'Role Management', 'slug' => 'role-management', 'icon' => 'shield', 'color' => 'green'],
                ['name' => 'Permission Management', 'slug' => 'permission-management', 'icon' => 'key', 'color' => 'purple'],
                ['name' => 'Loan Management', 'slug' => 'loan-management', 'icon' => 'money-bill-wave', 'color' => 'yellow'],
                ['name' => 'Client Management', 'slug' => 'client-management', 'icon' => 'user-friends', 'color' => 'indigo'],
                ['name' => 'Dashboard', 'slug' => 'dashboard', 'icon' => 'tachometer-alt', 'color' => 'red'],
                ['name' => 'Reports', 'slug' => 'reports', 'icon' => 'chart-bar', 'color' => 'orange'],
                ['name' => 'Settings', 'slug' => 'settings', 'icon' => 'cog', 'color' => 'gray'],
            ];

            foreach ($groups as $group) {
                PermissionGroup::create($group);
            }

            // Create core permissions
            $permissions = [
                // Dashboard
                ['name' => 'dashboard.view', 'display_name' => 'View Dashboard', 'module' => 'dashboard', 'permission_group_id' => 6],

                // User Management
                ['name' => 'users.view', 'display_name' => 'View Users', 'module' => 'users', 'permission_group_id' => 1],
                ['name' => 'users.create', 'display_name' => 'Create Users', 'module' => 'users', 'permission_group_id' => 1],
                ['name' => 'users.edit', 'display_name' => 'Edit Users', 'module' => 'users', 'permission_group_id' => 1],
                ['name' => 'users.delete', 'display_name' => 'Delete Users', 'module' => 'users', 'permission_group_id' => 1],
                ['name' => 'users.roles.manage', 'display_name' => 'Manage User Roles', 'module' => 'users', 'permission_group_id' => 1],
                ['name' => 'users.permissions.manage', 'display_name' => 'Manage User Permissions', 'module' => 'users', 'permission_group_id' => 1],

                // Role Management
                ['name' => 'roles.view', 'display_name' => 'View Roles', 'module' => 'roles', 'permission_group_id' => 2],
                ['name' => 'roles.create', 'display_name' => 'Create Roles', 'module' => 'roles', 'permission_group_id' => 2],
                ['name' => 'roles.edit', 'display_name' => 'Edit Roles', 'module' => 'roles', 'permission_group_id' => 2],
                ['name' => 'roles.delete', 'display_name' => 'Delete Roles', 'module' => 'roles', 'permission_group_id' => 2],

                // Permission Management
                ['name' => 'permissions.view', 'display_name' => 'View Permissions', 'module' => 'permissions', 'permission_group_id' => 3],
                ['name' => 'permissions.create', 'display_name' => 'Create Permissions', 'module' => 'permissions', 'permission_group_id' => 3],
                ['name' => 'permissions.edit', 'display_name' => 'Edit Permissions', 'module' => 'permissions', 'permission_group_id' => 3],
                ['name' => 'permissions.delete', 'display_name' => 'Delete Permissions', 'module' => 'permissions', 'permission_group_id' => 3],
            ];

            foreach ($permissions as $permission) {
                Permission::create(array_merge($permission, [
                    'guard_name' => 'web',
                    'is_core' => true,
                ]));
            }

            // Create system roles
            $roles = [
                [
                    'name' => 'super_admin',
                    'display_name' => 'Super Administrator',
                    'description' => 'Has full system access',
                    'level' => 'super_admin',
                    'hierarchy' => 1,
                    'is_system' => true,
                    'is_editable' => false,
                    'guard_name' => 'web',
                ],
                [
                    'name' => 'admin',
                    'display_name' => 'Administrator',
                    'description' => 'Has administrative access',
                    'level' => 'admin',
                    'hierarchy' => 10,
                    'is_system' => true,
                    'is_editable' => true,
                    'guard_name' => 'web',
                ],
                [
                    'name' => 'staff',
                    'display_name' => 'Staff',
                    'description' => 'Regular staff member',
                    'level' => 'staff',
                    'hierarchy' => 100,
                    'is_system' => false,
                    'is_editable' => true,
                    'is_default' => true,
                    'guard_name' => 'web',
                ],
            ];

            foreach ($roles as $roleData) {
                Role::create($roleData);
            }

            // Assign permissions to roles
            $superAdmin = Role::where('name', 'super_admin')->first();
            $superAdmin->syncPermissions(Permission::all());

            $admin = Role::where('name', 'admin')->first();
            $adminPermissions = Permission::where('module', '!=', 'permissions')->get();
            $admin->syncPermissions($adminPermissions);

            $staff = Role::where('name', 'staff')->first();
            $staffPermissions = Permission::whereIn('name', [
                'dashboard.view',
            ])->get();
            $staff->syncPermissions($staffPermissions);

          
            // Create super admin user
            $superAdminUser = User::create([
                'user_name' => 'Super Admin',
                'email' => 'superadmin@example.com',
                'password' => Hash::make('password123'),
                'is_active' => true,
            ]);

            $superAdminUser->assignRole('super_admin');

            // Create staff details with phone
            StaffDetail::create([
                'user_id' => $superAdminUser->id,
                'employee_id' => 'EMP001',
                'designation' => 'System Administrator',
                'department' => 'IT',
                'phone' => '1234567890', // Phone moved here
                'joining_date' => now(),
                'employment_type' => 'permanent',
                'salary' => 100000,
            ]);

            DB::commit();

            $this->command->info('✅ Role and permission seeder completed successfully!');
            $this->command->info('👤 Super Admin User:');
            $this->command->info('   Email: superadmin@example.com');
            $this->command->info('   Password: password123');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Seeder failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
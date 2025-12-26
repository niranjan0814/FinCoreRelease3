<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\PermissionGroup;
use App\Models\StaffDetail;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // // Create a super admin user
        // $superAdmin = User::create([
        //     'name' => 'Super Admin',
        //     'email' => 'superadmin@example.com',
        //     'password' => Hash::make('password'),
        //     'is_active' => true,
        // ]);

        // // Create a role for the super admin
        // $superAdminRole = Role::create([
        //     'name' => 'Super Admin',
        //     'slug' => 'super-admin',
        //     'is_active' => true,
        // ]);

        // // Assign the super admin role to the super admin user
        // $superAdmin->assignRole($superAdminRole);

        // // Create a staff detail for the super admin
        // StaffDetail::create([
        //     'user_id' => $superAdmin->id,
        //     'staff_id' => 'SA001',
        //     'is_active' => true,
        // ]);

        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        // Clear cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

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
            // User Management
            ['name' => 'users.view', 'display_name' => 'View Users', 'module' => 'users', 'permission_group_id' => 1],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'module' => 'users', 'permission_group_id' => 1],
            ['name' => 'users.edit', 'display_name' => 'Edit Users', 'module' => 'users', 'permission_group_id' => 1],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'module' => 'users', 'permission_group_id' => 1],
            ['name' => 'users.roles.manage', 'display_name' => 'Manage User Roles', 'module' => 'users', 'permission_group_id' => 1],
            ['name' => 'users.permissions.manage', 'display_name' => 'Manage User Permissions', 'module' => 'users', 'permission_group_id' => 1],
            ['name' => 'users.status.manage', 'display_name' => 'Manage User Status', 'module' => 'users', 'permission_group_id' => 1],

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
            ['name' => 'permissions.sync', 'display_name' => 'Sync Module Permissions', 'module' => 'permissions', 'permission_group_id' => 3],

            // Dashboard
            ['name' => 'dashboard.view', 'display_name' => 'View Dashboard', 'module' => 'dashboard', 'permission_group_id' => 6],

            // System permissions (super admin only)
            ['name' => 'system.settings.manage', 'display_name' => 'Manage System Settings', 'module' => 'system', 'permission_group_id' => 8, 'is_core' => true],
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
                'name' => 'manager',
                'display_name' => 'Manager',
                'description' => 'Has management access',
                'level' => 'manager',
                'hierarchy' => 20,
                'is_system' => false,
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
        $adminPermissions = Permission::whereIn('module', ['users', 'roles', 'permissions', 'dashboard'])->get();
        $admin->syncPermissions($adminPermissions);

        $manager = Role::where('name', 'manager')->first();
        $managerPermissions = Permission::whereIn('name', [
            'users.view',
            'dashboard.view',
        ])->get();
        $manager->syncPermissions($managerPermissions);

        $staff = Role::where('name', 'staff')->first();
        $staffPermissions = Permission::whereIn('name', [
            'dashboard.view',
        ])->get();
        $staff->syncPermissions($staffPermissions);

        // Create super admin user
        $superAdminUser = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.com',
            'password' => Hash::make('password123'),
            'phone' => '1234567890',
            'status' => 'active',
        ]);

        $superAdminUser->assignRole('super_admin');

        // Create staff details for super admin
        StaffDetail::create([
            'user_id' => $superAdminUser->id,
            'employee_id' => 'EMP001',
            'designation' => 'System Administrator',
            'department' => 'IT',
            'joining_date' => now(),
            'employment_type' => 'permanent',
            'salary' => 100000,
        ]);

        // Create admin user
        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'phone' => '1234567891',
            'status' => 'active',
        ]);

        $adminUser->assignRole('admin');

        // Create staff user
        $staffUser = User::create([
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'password' => Hash::make('password123'),
            'phone' => '1234567892',
            'status' => 'active',
        ]);

        $staffUser->assignRole('staff');
    }
}
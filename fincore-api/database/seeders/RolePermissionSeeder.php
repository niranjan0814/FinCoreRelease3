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
                //['name' => 'Client Management', 'slug' => 'client-management', 'icon' => 'user-friends', 'color' => 'indigo'],
                ['name' => 'Dashboard', 'slug' => 'dashboard', 'icon' => 'tachometer-alt', 'color' => 'red'],
                ['name' => 'Reports', 'slug' => 'reports', 'icon' => 'chart-bar', 'color' => 'orange'],
                ['name' => 'Settings', 'slug' => 'settings', 'icon' => 'cog', 'color' => 'gray'],
                ['name' => 'Branch Management', 'slug' => 'branch-management', 'icon' => 'building', 'color' => 'blue'],
                ['name' => 'Center Management', 'slug' => 'center-management', 'icon' => 'money-bill-wave', 'color' => 'yellow'],
                ['name' => 'Group Management', 'slug' => 'group-management', 'icon' => 'users', 'color' => 'blue'],
                ['name' => 'Investment Management', 'slug' => 'investment-management', 'icon' => 'users', 'color' => 'blue'],
                ['name' => 'Customer Management', 'slug' => 'customer-management', 'icon' => 'users', 'color' => 'blue'],
            ];

            foreach ($groups as $group) {
                PermissionGroup::firstOrCreate(['slug' => $group['slug']], $group);
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

                // Admin Management
                ['name' => 'admins.view', 'display_name' => 'View Admins', 'module' => 'admins', 'permission_group_id' => 1],
                ['name' => 'admins.create', 'display_name' => 'Create Admins', 'module' => 'admins', 'permission_group_id' => 1],
                ['name' => 'admins.edit', 'display_name' => 'Edit Admins', 'module' => 'admins', 'permission_group_id' => 1],
                ['name' => 'admins.delete', 'display_name' => 'Delete Admins', 'module' => 'admins', 'permission_group_id' => 1],

                // Staff Management
                ['name' => 'staff.view', 'display_name' => 'View Staff', 'module' => 'staff', 'permission_group_id' => 1],
                ['name' => 'staff.create', 'display_name' => 'Create Staff', 'module' => 'staff', 'permission_group_id' => 1],
                ['name' => 'staff.edit', 'display_name' => 'Edit Staff', 'module' => 'staff', 'permission_group_id' => 1],
                ['name' => 'staff.delete', 'display_name' => 'Delete Staff', 'module' => 'staff', 'permission_group_id' => 1],

                // Customer Management
                ['name' => 'customers.view', 'display_name' => 'View Customers', 'module' => 'customers', 'permission_group_id' => 5],
                ['name' => 'customers.create', 'display_name' => 'Create Customers', 'module' => 'customers', 'permission_group_id' => 5],
                ['name' => 'customers.edit', 'display_name' => 'Edit Customers', 'module' => 'customers', 'permission_group_id' => 5],
                ['name' => 'customers.delete', 'display_name' => 'Delete Customers', 'module' => 'customers', 'permission_group_id' => 5],
                ['name' => 'customers.import', 'display_name' => 'Import Customers', 'module' => 'customers', 'permission_group_id' => 5],
                ['name' => 'customers.export', 'display_name' => 'Export Customers', 'module' => 'customers', 'permission_group_id' => 5],
                ['name' => 'customers.approve_transfer', 'display_name' => 'Approve Center Transfer', 'module' => 'customers', 'permission_group_id' => 5], // New permission
                //branch management
                ['name' => 'branches.view', 'display_name' => 'View Branches', 'module' => 'branches', 'permission_group_id' => 1],
                ['name' => 'branches.create', 'display_name' => 'Create Branches', 'module' => 'branches', 'permission_group_id' => 1],
                ['name' => 'branches.edit', 'display_name' => 'Edit Branches', 'module' => 'branches', 'permission_group_id' => 1],
                ['name' => 'branches.delete', 'display_name' => 'Delete Branches', 'module' => 'branches', 'permission_group_id' => 1], 

                //center management
                ['name' => 'centers.view', 'display_name' => 'View Centers', 'module' => 'centers', 'permission_group_id' => 1],
                ['name' => 'centers.create', 'display_name' => 'Create Centers', 'module' => 'centers', 'permission_group_id' => 1],
                ['name' => 'centers.edit', 'display_name' => 'Edit Centers', 'module' => 'centers', 'permission_group_id' => 1],
                ['name' => 'centers.delete', 'display_name' => 'Delete Centers', 'module' => 'centers', 'permission_group_id' => 1],

                //group management
                ['name' => 'groups.view', 'display_name' => 'View Groups', 'module' => 'groups', 'permission_group_id' => 1],
                ['name' => 'groups.create', 'display_name' => 'Create Groups', 'module' => 'groups', 'permission_group_id' => 1],
                ['name' => 'groups.edit', 'display_name' => 'Edit Groups', 'module' => 'groups', 'permission_group_id' => 1],
                ['name' => 'groups.delete', 'display_name' => 'Delete Groups', 'module' => 'groups', 'permission_group_id' => 1],

                //investor management
                ['name' => 'investors.view', 'display_name' => 'View Investors', 'module' => 'investors', 'permission_group_id' => 1],
                ['name' => 'investors.create', 'display_name' => 'Create Investors', 'module' => 'investors', 'permission_group_id' => 1],
                ['name' => 'investors.edit', 'display_name' => 'Edit Investors', 'module' => 'investors', 'permission_group_id' => 1],
                ['name' => 'investors.delete', 'display_name' => 'Delete Investors', 'module' => 'investors', 'permission_group_id' => 1],

                //loan management
                // Loan Management
                ['name' => 'loans.view', 'display_name' => 'View Loans', 'module' => 'loans', 'permission_group_id' => 4],
                ['name' => 'loans.create', 'display_name' => 'Create Loans', 'module' => 'loans', 'permission_group_id' => 4],
                ['name' => 'loans.edit', 'display_name' => 'Edit Loans', 'module' => 'loans', 'permission_group_id' => 4],
                ['name' => 'loans.delete', 'display_name' => 'Delete Loans', 'module' => 'loans', 'permission_group_id' => 4],
                ['name' => 'loans.import', 'display_name' => 'Import Loans', 'module' => 'loans', 'permission_group_id' => 4],
                ['name' => 'loans.export', 'display_name' => 'Export Loans', 'module' => 'loans', 'permission_group_id' => 4],

                // Loan Products
                ['name' => 'loan_products.view', 'display_name' => 'View Loan Products', 'module' => 'loan_products', 'permission_group_id' => 4],
                ['name' => 'loan_products.create', 'display_name' => 'Create Loan Products', 'module' => 'loan_products', 'permission_group_id' => 4],
                ['name' => 'loan_products.edit', 'display_name' => 'Edit Loan Products', 'module' => 'loan_products', 'permission_group_id' => 4],
                ['name' => 'loan_products.delete', 'display_name' => 'Delete Loan Products', 'module' => 'loan_products', 'permission_group_id' => 4],

                // Investment Products
                ['name' => 'investment_products.view', 'display_name' => 'View Investment Products', 'module' => 'investment_products', 'permission_group_id' => 12],
                ['name' => 'investment_products.create', 'display_name' => 'Create Investment Products', 'module' => 'investment_products', 'permission_group_id' => 12],
                ['name' => 'investment_products.edit', 'display_name' => 'Edit Investment Products', 'module' => 'investment_products', 'permission_group_id' => 12],
                ['name' => 'investment_products.delete', 'display_name' => 'Delete Investment Products', 'module' => 'investment_products', 'permission_group_id' => 12],

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
                Permission::firstOrCreate(['name' => $permission['name']], array_merge($permission, [
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
                    'description' => 'Regular manager member',
                    'level' => 'manager',
                    'hierarchy' => 100,
                    'is_system' => false,
                    'is_editable' => true,
                    'is_default' => true,
                    'guard_name' => 'web',
                ],
                [
                    'name' =>'field_officer', 
                    'display_name' => 'Field Officer', 
                    'description' => 'Regular field officer member', 
                    'level' => 'field_officer', 
                    'hierarchy' => 150, 'is_system' => false, 
                    'is_editable' => true, 'is_default' => true, 
                    'guard_name' => 'web'
                ],
                [
                    'name' => 'staff',
                    'display_name' => 'Staff',
                    'description' => 'Regular staff member',
                    'level' => 'staff',
                    'hierarchy' => 200,
                    'is_system' => false,
                    'is_editable' => true,
                    'is_default' => true,
                    'guard_name' => 'web',
                ],
            ];

            foreach ($roles as $roleData) {
                Role::firstOrCreate(['name' => $roleData['name']], $roleData);
            }

            // Assign permissions to roles
            $superAdminRole = Role::where('name', 'super_admin')->first();
            $superAdminPermissions = Permission::whereIn('name', [
                'dashboard.view',
                'staff.view',
                'staff.create',
                'staff.edit',
                'staff.delete',
                
                'users.view',
                // 'users.create',
                // 'users.edit',
                // 'users.delete',
                'users.roles.manage',
                'users.permissions.manage',

                'branches.view',
                // 'branches.create',
                // 'branches.edit',
                // 'branches.delete',

                'loan_products.view',
                // 'loan_products.create',
                // 'loan_products.edit',
                // 'loan_products.delete',

                'investment_products.view',
                // 'investment_products.create',
                // 'investment_products.edit',
                // 'investment_products.delete',

                'admins.view',
                'admins.create',
                'admins.edit',
                'admins.delete',
                'roles.view',
                'roles.create',
                'roles.edit',
                'roles.delete',
                'permissions.create',
                'permissions.edit',
                'permissions.delete',
                'permissions.view',
                'centers.view',
                'customers.import',
                'customers.export',
                'loans.import',
                'loans.export',
                'customers.approve_transfer',
            ])->get();
            if ($superAdminRole) {
                $superAdminRole->syncPermissions($superAdminPermissions);
            }

            $adminRole = Role::where('name', 'admin')->first();
            $adminPermissions = Permission::whereIn('name', [
                'dashboard.view',
                
                'staff.view',
                'staff.create',
                'staff.edit',
                'staff.delete',

                'users.view',
                'users.create',
                'users.edit',
                'users.delete',
                'users.roles.manage',
                'users.permissions.manage',
                
                'branches.view',
                'branches.create',
                'branches.edit',
                'branches.delete',

                'loan_products.view',
                'loan_products.create',
                'loan_products.edit',
                'loan_products.delete',

                'investment_products.view',
                'investment_products.create',
                'investment_products.edit',
                'investment_products.delete',

                'admins.view',
                'admins.create',
                'admins.edit',
                'admins.delete',
                'roles.view',
                'roles.create',
                'roles.edit',
                'roles.delete',
                'permissions.view',
                'centers.delete',
                
                
                'centers.view',
                'centers.create',
                'centers.edit',
                'customers.import',
                'customers.export',
                'loans.import',
                'loans.export',
                'customers.approve_transfer',
                
            ])->get();
             if ($adminRole) {
                $adminRole->syncPermissions($adminPermissions);
            }

           
           

            $managerRole = Role::where('name', 'manager')->first();
            $managerPermissions = Permission::whereIn('name', [
                'dashboard.view',
                'centers.view',
                'centers.edit',
                'customers.approve_transfer',
            ])->get();
            if ($managerRole) {
                $managerRole->syncPermissions($managerPermissions);
            }

            $fieldOfficerRole = Role::where('name', 'field_officer')->first();
            $fieldOfficerPermissions = Permission::whereIn('name', [
                'dashboard.view',
                'centers.view',
                'centers.create',
                'centers.edit',
                'groups.view',
                'groups.create',
                'groups.edit',
                'groups.delete',
                'customers.view',
                'customers.create',
                'customers.edit',
                'customers.delete',
            ])->get();
            if ($fieldOfficerRole) {
                $fieldOfficerRole->syncPermissions($fieldOfficerPermissions);
            }

            $staffRole = Role::where('name', 'staff')->first();
            $staffPermissions = Permission::whereIn('name', [
                'dashboard.view',
                'customers.view',
                'customers.create',
                'customers.edit',
                'customers.delete',
                'customers.import',
                'customers.export',
            ])->get();
            if ($staffRole) {
                $staffRole->syncPermissions($staffPermissions);
            }

          
            // Create super admin user
            $superAdminUser = User::firstOrCreate(
                ['email' => 'admin@fincore.com'],
                [
                    'user_name' => 'SA0001',
                    'password'          => 'S@1234admin',
                    'digital_signature' => Hash::make('SA0001'),
                    'is_active'         => true,
                    'failed_login_attempts' => 0,
                ]
            );

            $superAdminUser->assignRole('super_admin');

            // Create staff details with phone
            StaffDetail::firstOrCreate(
                ['user_id' => $superAdminUser->id],
                [
                    'employee_id' => 'EMP001',
                    'designation' => 'System Administrator',
                    'department' => 'IT',
                    'phone' => '1234567890',
                    'joining_date' => now(),
                    'employment_type' => 'permanent',
                    'salary' => 100000,
                ]
            );

            DB::commit();

            $this->command->info('✅ Role and permission seeder completed successfully!');
            $this->command->info('👤 Super Admin User:');
            $this->command->info('   Email: admin@fincore.com');
            $this->command->info('   Password: S@1234admin');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Seeder failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
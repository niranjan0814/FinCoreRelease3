<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\PermissionGroup;

class SessionPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permission group for Sessions
        $sessionGroup = PermissionGroup::firstOrCreate(
            ['slug' => 'sessions-attendance'],
            [
                'name' => 'Sessions & Attendance',
                'description' => 'Permissions related to staff sessions and attendance tracking',
                'order' => 100,
                'is_active' => true,
            ]
        );

        // Define session-related permissions
        $permissions = [
            // Session permissions
            [
                'name' => 'sessions.view',
                'display_name' => 'View Own Sessions',
                'description' => 'Can view own session history',
                'module' => 'sessions',
            ],
            [
                'name' => 'sessions.view_all',
                'display_name' => 'View All Sessions',
                'description' => 'Can view all staff sessions',
                'module' => 'sessions',
            ],
            
            // Attendance permissions
            [
                'name' => 'attendance.view',
                'display_name' => 'View Attendance',
                'description' => 'Can view attendance records',
                'module' => 'attendance',
            ],
            [
                'name' => 'attendance.approve',
                'display_name' => 'Approve Attendance',
                'description' => 'Can approve or reject attendance requests',
                'module' => 'attendance',
            ],
            [
                'name' => 'attendance.view_reports',
                'display_name' => 'View Attendance Reports',
                'description' => 'Can view attendance reports for all staff',
                'module' => 'attendance',
            ],
            
            // User unlock permission
            [
                'name' => 'users.unlock',
                'display_name' => 'Unlock User Account',
                'description' => 'Can manually unlock locked user accounts',
                'module' => 'users',
            ],
        ];

        foreach ($permissions as $permissionData) {
            Permission::firstOrCreate(
                ['name' => $permissionData['name'], 'guard_name' => 'web'],
                array_merge($permissionData, [
                    'permission_group_id' => $sessionGroup->id,
                    'guard_name' => 'web',
                ])
            );
        }

        // Assign permissions to roles
        $superAdminRole = Role::where('name', 'super_admin')->first();
        $adminRole = Role::where('name', 'admin')->first();
        $managerRole = Role::where('name', 'manager')->first();

        if ($superAdminRole) {
            $superAdminRole->givePermissionTo([
                'sessions.view',
                'sessions.view_all',
                'attendance.view',
                'attendance.approve',
                'attendance.view_reports',
                'users.unlock',
            ]);
        }

        if ($adminRole) {
            $adminRole->givePermissionTo([
                'sessions.view',
                'sessions.view_all',
                'attendance.view',
                'attendance.approve',
                'attendance.view_reports',
                'users.unlock',
            ]);
        }

        if ($managerRole) {
            $managerRole->givePermissionTo([
                'sessions.view',
                'sessions.view_all',
                'attendance.view',
                'attendance.approve',
                'attendance.view_reports',
            ]);
        }

        $this->command->info('Session and Attendance permissions seeded successfully!');
    }
}


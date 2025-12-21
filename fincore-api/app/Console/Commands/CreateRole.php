<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Role;

class CreateRole extends Command
{
    protected $signature = 'role:create 
                            {name : Role name}
                            {--display-name= : Display name}
                            {--description= : Role description}
                            {--level=staff : Role level (super_admin, admin, manager, staff)}
                            {--hierarchy=100 : Hierarchy level}
                            {--permissions=* : Permission names to assign}';
    
    protected $description = 'Create a new role with permissions';

    public function handle()
    {
        $name = $this->argument('name');
        $displayName = $this->option('display-name') ?: ucwords(str_replace('_', ' ', $name));
        $description = $this->option('description');
        $level = $this->option('level');
        $hierarchy = $this->option('hierarchy');
        $permissionNames = $this->option('permissions');

        // Check if role exists
        if (Role::where('name', $name)->exists()) {
            $this->error("Role '{$name}' already exists!");
            return 1;
        }

        // Create role
        $role = Role::create([
            'name' => $name,
            'display_name' => $displayName,
            'description' => $description,
            'level' => $level,
            'hierarchy' => $hierarchy,
            'guard_name' => 'web',
        ]);

        // Assign permissions
        if (!empty($permissionNames)) {
            $permissions = \App\Models\Permission::whereIn('name', $permissionNames)->get();
            $role->syncPermissions($permissions);
        }

        $this->info("Role '{$name}' created successfully!");
        $this->info("Display Name: {$displayName}");
        $this->info("Level: {$level}");
        $this->info("Hierarchy: {$hierarchy}");
        $this->info("Permissions: " . implode(', ', $permissionNames));

        return 0;
    }
}
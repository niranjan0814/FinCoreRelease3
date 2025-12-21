<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\PermissionService;

class SyncModulePermissions extends Command
{
    protected $signature = 'permissions:sync {module} {--file=}';
    protected $description = 'Sync permissions for a module from JSON file';

    public function handle(PermissionService $permissionService)
    {
        $module = $this->argument('module');
        $file = $this->option('file');

        if (!$file) {
            $file = base_path("modules/{$module}/permissions.json");
        }

        if (!file_exists($file)) {
            $this->error("Permission file not found: {$file}");
            return 1;
        }

        $permissions = json_decode(file_get_contents($file), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->error('Invalid JSON file');
            return 1;
        }

        try {
            $result = $permissionService->syncModulePermissions($module, $permissions);
            
            $this->info("Module '{$module}' permissions synced successfully!");
            $this->info("New permissions: " . count($result['new']));
            $this->info("Updated permissions: " . count($result['updated']));
            $this->info("Removed permissions: " . count($result['removed']));
            
        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
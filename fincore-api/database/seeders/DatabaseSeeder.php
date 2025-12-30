<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Run ONLY Super Admin seeder
        //$this->call(SuperAdminStaffSeeder::class);
        //$this->call(SuperAdminSeeder::class);
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
        $this->call([
            RolePermissionSeeder::class,
            //SessionPermissionSeeder::class,
        ]);
    }
}

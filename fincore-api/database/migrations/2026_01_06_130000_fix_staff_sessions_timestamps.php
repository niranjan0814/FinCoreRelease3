<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Use raw SQL to avoid doctrine/dbal dependency issues.
        // We modify login_at to DATETIME to prevent MySQL's "ON UPDATE CURRENT_TIMESTAMP" legacy behavior
        // which was likely causing the login time to reset whenever the row was updated (e.g. on resume/logout).
        // This ensures login_at remains fixed at the original creation time.
        
        DB::statement("ALTER TABLE staff_sessions MODIFY login_at DATETIME NOT NULL");
        DB::statement("ALTER TABLE staff_sessions MODIFY logout_at DATETIME NULL");
        DB::statement("ALTER TABLE staff_sessions MODIFY approved_at DATETIME NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to TIMESTAMP
        DB::statement("ALTER TABLE staff_sessions MODIFY login_at TIMESTAMP NOT NULL");
        DB::statement("ALTER TABLE staff_sessions MODIFY logout_at TIMESTAMP NULL");
        DB::statement("ALTER TABLE staff_sessions MODIFY approved_at TIMESTAMP NULL");
    }
};

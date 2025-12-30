<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            // Drop the simple enum if it exists (or just change it)
            // Note: In SQLite/some DBs changing enum is tricky, but here we'll try to refine it
            $table->string('status')->default('pending_1st')->change();
            $table->integer('approval_level')->default(0)->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn('approval_level');
        });
    }
};

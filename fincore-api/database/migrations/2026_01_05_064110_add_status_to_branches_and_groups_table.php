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
        Schema::table('branches', function (Blueprint $table) {
            $table->string('status')->default('active')->after('branch_id'); // active, inactive
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->string('status')->default('active')->after('group_name'); // active, inactive, closed
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};

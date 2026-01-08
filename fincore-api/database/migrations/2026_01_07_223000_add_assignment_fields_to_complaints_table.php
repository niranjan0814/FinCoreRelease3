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
        Schema::table('complaints', function (Blueprint $table) {
            $table->string('assigner_id')->nullable()->after('assigned_to');
            $table->string('assigner_name')->nullable()->after('assigner_id');
            $table->unsignedBigInteger('assignee_id')->nullable()->after('assigner_name');
            $table->string('assignee_name')->nullable()->after('assignee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropColumn(['assigner_id', 'assigner_name', 'assignee_id', 'assignee_name']);
        });
    }
};

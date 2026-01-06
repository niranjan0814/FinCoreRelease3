<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds due date calculation fields to support the company's fixed due date system.
     * Business Rules:
     * - Fixed due days: 1, 8, 15, 22 of each month
     * - First due date uses skip-next-due logic based on activation date
     */
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            // Date when loan status changed to ACTIVE (disbursement date)
            $table->date('activation_date')->nullable()->after('agreement_date');
            
            // Calculated first due date using skip-next-due rule
            $table->date('first_due_date')->nullable()->after('activation_date');
            
            // Fixed due day of month (1, 8, 15, or 22)
            $table->unsignedTinyInteger('due_day')->nullable()->after('first_due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['activation_date', 'first_due_date', 'due_day']);
        });
    }
};

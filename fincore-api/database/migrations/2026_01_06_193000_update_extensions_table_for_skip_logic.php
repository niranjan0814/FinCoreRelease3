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
        Schema::table('loan_due_date_extensions', function (Blueprint $table) {
            // Add action_type column with default 'move' for existing records
            $table->string('action_type')->default('move')->after('loan_id');
            // Make new_due_date nullable to support 'skip' action
            $table->date('new_due_date')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loan_due_date_extensions', function (Blueprint $table) {
            $table->dropColumn('action_type');
            $table->date('new_due_date')->nullable(false)->change();
        });
    }
};

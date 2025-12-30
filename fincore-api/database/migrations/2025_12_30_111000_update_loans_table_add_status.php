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
            $table->enum('status', ['Pending', 'Active', 'Completed', 'Defaulted'])->default('Pending')->after('loan_step');
            $table->decimal('outstanding_amount', 15, 2)->default(0)->after('approved_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['status', 'outstanding_amount']);
        });
    }
};

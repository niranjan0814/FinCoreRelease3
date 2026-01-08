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
        Schema::create('salary_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('staff_id');
            $table->string('month'); // e.g. "January 2026"
            $table->decimal('base_salary', 15, 2);
            $table->decimal('allowances', 15, 2)->default(0);
            $table->decimal('deductions', 15, 2)->default(0);
            $table->decimal('net_payable', 15, 2);
            $table->date('payment_date');
            $table->string('status')->default('Paid');
            $table->string('payment_method');
            $table->json('allowances_detail')->nullable(); // Required for manual allowances logic
            $table->text('notes')->nullable();
            $table->string('processed_by')->nullable();
            $table->timestamps();

            $table->foreign('staff_id')->references('staff_id')->on('staffs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_payments');
    }
};

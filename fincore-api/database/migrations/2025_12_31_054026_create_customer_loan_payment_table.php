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
        Schema::create('customer_loan_payment', function (Blueprint $table) {
            $table->id();
            
            // Foreign Keys
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('loan_id');
            $table->unsignedBigInteger('receipt_id')->nullable();
            
            // Payment Information
            $table->decimal('last_payment_amount', 15, 2)->default(0);
            $table->date('last_payment_date')->nullable();
            
            // Balance Information
            $table->decimal('full_balance', 15, 2)->default(0);
            $table->decimal('current_balance_amount', 15, 2)->default(0);
            $table->decimal('current_capital_balance', 15, 2)->default(0);
            $table->decimal('current_balance_interest', 15, 2)->default(0);
            
            // Interest and Rental
            $table->decimal('interest_amount', 15, 2)->default(0);
            $table->decimal('rental_amount', 15, 2)->default(0);
            
            // Due Information
            $table->decimal('total_due', 15, 2)->default(0);
            $table->decimal('remained_due', 15, 2)->default(0);
            
            // Arrears Information
            $table->decimal('arrears', 15, 2)->default(0);
            $table->integer('arrears_age')->default(0); // Days overdue
            
            $table->timestamps();
            
            // Foreign Key Constraints
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('loan_id')->references('id')->on('loans')->onDelete('cascade');
            $table->foreign('receipt_id')->references('id')->on('receipts')->onDelete('set null');
            
            // Indexes for performance
            $table->index('customer_id');
            $table->index('loan_id');
            $table->index('last_payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_loan_payment');
    }
};

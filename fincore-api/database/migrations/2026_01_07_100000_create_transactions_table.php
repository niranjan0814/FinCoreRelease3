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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('staff_id');
            $table->decimal('amount', 15, 2);
            $table->enum('type', ['inflow', 'outflow']);
            $table->string('category')->comment('expense, loan, salary, investment, collection');
            $table->unsignedBigInteger('related_id')->nullable()->comment('ID from related table like branch_expenses, loans, etc.');
            $table->string('status')->default('pending')->comment('pending, success, failed');
            $table->string('soap_ref_no')->nullable();
            $table->string('digital_sign')->nullable();
            $table->decimal('refund_amount', 15, 2)->nullable();
            $table->text('refund_reason')->nullable();
            $table->json('bank_details')->nullable();
            
            $table->timestamps();

            // Foreign key relation to staffs table
            $table->foreign('staff_id')->references('staff_id')->on('staffs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};

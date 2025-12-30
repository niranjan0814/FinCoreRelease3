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
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('loan_products');
            $table->foreignId('CSU_id')->constrained('centers');
            $table->foreignId('staff_id')->constrained('users');
            $table->string('loan_id')->unique();
            $table->date('agreement_date')->nullable();
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('group_id')->nullable()->constrained('groups');
            
            $table->decimal('request_amount', 15, 2);
            $table->decimal('approved_amount', 15, 2)->nullable();
            
            $table->string('loan_step')->nullable();
            $table->integer('terms')->comment('Number of installments');
            $table->decimal('interest_rate', 5, 2);
            $table->date('end_term')->nullable();
            
            $table->decimal('interest_rate_annum', 5, 2)->nullable();
            $table->decimal('interest_rate_week', 5, 2)->nullable();
            
            $table->decimal('service_charge', 15, 2)->default(0);
            $table->decimal('document_charge', 15, 2)->default(0);
            $table->decimal('rentel', 15, 2)->nullable()->comment('Rental / Installment amount');
            
            $table->json('borrower_bank_details')->nullable();
            $table->boolean('joint_borrow')->default(false);
            
            $table->json('g1_details')->nullable()->comment('Guarantor 1 details');
            $table->json('g2_details')->nullable()->comment('Guarantor 2 details');
            $table->json('w1_details')->nullable()->comment('Witness 1 details');
            $table->json('w2_details')->nullable()->comment('Witness 2 details');
            
            $table->decimal('fuil_amount', 15, 2)->nullable()->comment('Full amount with interest');
            $table->decimal('bank_transfer_amount', 15, 2)->nullable();
            
            $table->json('approve_history')->nullable();
            
            $table->decimal('reduce_presenence_in_interest', 5, 2)->nullable();
            $table->decimal('reduce_presentence_in_capital', 5, 2)->nullable();
            
            $table->string('document_id')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};

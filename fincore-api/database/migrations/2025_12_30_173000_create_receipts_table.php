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
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_id')->unique();
            $table->unsignedBigInteger('staff_id'); // Assuming staff_id is an integer foreign key to users or staff table
            $table->string('digital_sign')->nullable(); // Foreign key reference or path? Assuming string for now based on typical usage
            $table->foreignId('center_id')->constrained('centers')->onDelete('cascade');
            $table->foreignId('group_id')->nullable()->constrained('groups')->onDelete('set null');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('loan_id')->constrained('loans')->onDelete('cascade');
            $table->decimal('current_due', 10, 2)->default(0);
            $table->decimal('current_due_amount', 10, 2)->default(0);
            $table->decimal('current_balance_amount', 10, 2)->default(0);
            $table->integer('copy_count')->default(0);
            $table->string('status')->default('active'); // active, cancellation_pending, cancelled
            $table->text('comments')->nullable();
            
            // Cancellation workflow
            $table->text('cancellation_reason')->nullable();
            $table->foreignId('cancellation_requested_by')->nullable()->constrained('users');
            $table->foreignId('cancellation_approved_by')->nullable()->constrained('users');
            $table->timestamp('cancellation_approved_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};

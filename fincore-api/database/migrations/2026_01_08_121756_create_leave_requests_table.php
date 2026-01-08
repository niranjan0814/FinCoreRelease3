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
        Schema::create('leave_requests', function (Blueprint $row) {
            $row->id();
            $row->foreignId('user_id')->constrained()->onDelete('cascade');
            $row->string('user_name');
            $row->string('user_role');
            $row->date('start_date');
            $row->date('end_date');
            $row->integer('total_days');
            $row->text('reason');
            $row->string('status')->default('Pending'); // Pending, Approved, Rejected
            $row->timestamp('requested_at')->useCurrent();
            $row->foreignId('approved_by')->nullable()->constrained('users');
            $row->timestamp('approved_at')->nullable();
            $row->text('rejection_reason')->nullable();
            $row->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};

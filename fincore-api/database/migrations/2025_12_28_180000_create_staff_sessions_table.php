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
        Schema::create('staff_sessions', function (Blueprint $table) {
            $table->id();
            
            // user_id references users.id, but represents both user and staff (since users.id = staffs.staff_id value)
            $table->unsignedBigInteger('user_id');
            
            // Working date for this session (YYYY-MM-DD format, stored as date type)
            $table->date('date');
            
            // Login and logout timestamps
            $table->timestamp('login_at');
            $table->timestamp('logout_at')->nullable();
            
            // Logout type: LOGOUT, ON_WORK, STAY_IN_OFFICE, AUTO_LOGOUT
            $table->enum('logout_type', ['LOGOUT', 'ON_WORK', 'STAY_IN_OFFICE', 'AUTO_LOGOUT'])->nullable();
            
            // Whether session was ended by system (true) or user action (false)
            $table->boolean('auto_logged_out')->default(false);
            
            // Session status: OPEN or CLOSED
            $table->enum('status', ['OPEN', 'CLOSED'])->default('OPEN');
            
            // Total minutes worked in this session (calculated on session close)
            $table->integer('worked_minutes')->default(0);
            
            // Attendance status: PRESENT, PENDING, APPROVED, REJECTED
            $table->enum('attendance_status', ['PRESENT', 'PENDING', 'APPROVED', 'REJECTED'])->default('PRESENT');
            
            // Manager who approved/rejected attendance
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            
            // Optional notes for overrides or approvals
            $table->text('remarks')->nullable();
            
            // IP address from which user logged in
            $table->string('login_ip', 45)->nullable();
            
            // User agent string from login
            $table->string('user_agent')->nullable();
            
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            
            // Indexes for common queries
            $table->index(['user_id', 'date']);
            $table->index(['date', 'status']);
            $table->index('attendance_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_sessions');
    }
};

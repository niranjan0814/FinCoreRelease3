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
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->unique();
            $table->string('complainant_name');
            $table->string('complainant_type'); // Customer, Staff, Branch
            $table->string('branch_name')->nullable();
            $table->string('category');
            $table->string('subject');
            $table->text('description');
            $table->string('priority')->default('Medium'); // High, Medium, Low
            $table->string('status')->default('Open'); // Open, In Progress, Resolved, Closed
            $table->string('assigned_to')->nullable(); // Keeping as string for flexibility as per requirement
            $table->text('resolution')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};

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
        Schema::create('customer_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('staff_id')->constrained('users')->onDelete('cascade'); // Link to user table
            $table->string('activity_type'); // e.g., 'Meeting', 'Call', 'Visit'
            $table->text('description')->nullable();
            $table->string('customer_behavior')->nullable(); // e.g., 'Positive', 'Neutral', 'Negative'
            $table->string('outcome')->nullable(); 
            $table->timestamp('activity_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_activities');
    }
};

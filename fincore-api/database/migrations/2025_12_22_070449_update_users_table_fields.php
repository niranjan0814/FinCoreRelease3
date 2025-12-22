<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop existing columns to be replaced
            $table->dropColumn(['name', 'status', 'login_attempts', 'phone']);
            
            // Add new columns
            $table->string('user_name')->after('id');
            $table->string('digital_signature')->nullable()->after('user_name');
            $table->boolean('is_active')->default(true)->after('digital_signature');
            $table->integer('failed_login_attempts')->default(0)->after('two_factor_confirmed_at');
            
            // Add indexes
            $table->index('user_name');
            $table->index('is_active');
            $table->index('failed_login_attempts');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Reverse the changes
            $table->dropColumn(['user_name', 'digital_signature', 'is_active', 'failed_login_attempts']);
            
            // Restore original columns
            $table->string('name')->after('id');
            $table->string('phone')->nullable()->after('email');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('avatar');
            $table->integer('login_attempts')->default(0)->after('two_factor_confirmed_at');
        });
    }
};
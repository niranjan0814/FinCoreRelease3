<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            // Add fields to permissions table
            $table->foreignId('permission_group_id')->nullable()->after('id')->constrained('permission_groups')->onDelete('set null');
            $table->string('display_name')->nullable()->after('name');
            $table->text('description')->nullable()->after('display_name');
            $table->string('module')->nullable()->after('description');
            $table->boolean('is_core')->default(false)->after('module');
            $table->integer('order')->default(0)->after('is_core');
            $table->json('metadata')->nullable()->after('order');
            $table->softDeletes();
            
            // Indexes
            $table->index('permission_group_id');
            $table->index('module');
            $table->index('is_core');
        });
    }

    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropForeign(['permission_group_id']);
            $table->dropColumn([
                'permission_group_id',
                'display_name',
                'description',
                'module',
                'is_core',
                'order',
                'metadata'
            ]);
            $table->dropSoftDeletes();
        });
    }
};
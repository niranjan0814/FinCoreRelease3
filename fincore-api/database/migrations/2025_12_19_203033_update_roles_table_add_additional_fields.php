<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            // Add fields to roles table
            $table->string('display_name')->nullable()->after('name');
            $table->text('description')->nullable()->after('display_name');
            $table->string('level')->default('staff')->after('description'); // super_admin, admin, manager, staff
            $table->integer('hierarchy')->default(100)->after('level');
            $table->boolean('is_system')->default(false)->after('hierarchy');
            $table->boolean('is_default')->default(false)->after('is_system');
            $table->boolean('is_editable')->default(true)->after('is_default');
            $table->json('restrictions')->nullable()->after('is_editable');
            $table->softDeletes();
            
            // Indexes
            $table->index('level');
            $table->index('hierarchy');
            $table->index('is_system');
            $table->index('is_default');
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn([
                'display_name',
                'description',
                'level',
                'hierarchy',
                'is_system',
                'is_default',
                'is_editable',
                'restrictions'
            ]);
            $table->dropSoftDeletes();
        });
    }
};
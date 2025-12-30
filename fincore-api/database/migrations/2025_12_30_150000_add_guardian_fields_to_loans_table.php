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
        Schema::table('loans', function (Blueprint $table) {
            $table->string('guardian_nic')->nullable()->after('customer_id');
            $table->string('guardian_name')->nullable()->after('guardian_nic');
            $table->text('guardian_address')->nullable()->after('guardian_name');
            $table->string('guardian_phone')->nullable()->after('guardian_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['guardian_nic', 'guardian_name', 'guardian_address', 'guardian_phone']);
        });
    }
};

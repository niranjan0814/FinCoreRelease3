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
            $table->decimal('suspense_balance', 15, 2)->default(0)->after('outstanding_amount');
        });

        Schema::table('customer_loan_payment', function (Blueprint $table) {
            $table->decimal('suspense_generated', 15, 2)->default(0)->after('arrears');
            $table->decimal('suspense_used', 15, 2)->default(0)->after('suspense_generated');
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn('suspense_balance');
        });

        Schema::table('customer_loan_payment', function (Blueprint $table) {
            $table->dropColumn(['suspense_generated', 'suspense_used']);
        });
    }
};

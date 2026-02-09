<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->decimal('euro_credits', 10, 2)->default(0)->after('sms_credits');
        });

        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn('sms_credits');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->boolean('is_demo')->default(false)->after('status');
            $table->string('additional_phone', 20)->nullable()->after('sender');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn(['is_demo', 'additional_phone']);
        });

        Schema::table('partners', function (Blueprint $table) {
            $table->integer('sms_credits')->default(0)->after('logo_url');
        });

        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn('euro_credits');
        });
    }
};

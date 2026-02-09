<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->string('external_id')->nullable()->after('trigger_campaign_uuid');
            $table->text('error_message')->nullable()->after('external_id');
            $table->boolean('stats_notified')->default(false)->after('error_message');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->dropColumn(['external_id', 'error_message', 'stats_notified']);
        });
    }
};

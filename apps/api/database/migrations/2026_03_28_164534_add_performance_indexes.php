<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partner_pricings', function (Blueprint $table): void {
            $table->index(['partner_id', 'is_active', 'volume_min'], 'partner_pricings_pricing_lookup_index');
        });

        Schema::table('ai_contents', function (Blueprint $table): void {
            $table->index(['partner_id', 'is_favorite', 'updated_at'], 'ai_contents_recent_lookup_index');
        });

        if (Schema::hasColumn('campaigns', 'stats_notified')) {
            DB::statement('CREATE INDEX IF NOT EXISTS campaigns_stats_not_notified_index ON campaigns (stats_notified) WHERE NOT stats_notified');
        }
    }

    public function down(): void
    {
        Schema::table('partner_pricings', function (Blueprint $table): void {
            $table->dropIndex('partner_pricings_pricing_lookup_index');
        });

        Schema::table('ai_contents', function (Blueprint $table): void {
            $table->dropIndex('ai_contents_recent_lookup_index');
        });

        DB::statement('DROP INDEX IF EXISTS campaigns_stats_not_notified_index');
    }
};

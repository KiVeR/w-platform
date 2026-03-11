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
            $table->string('routing_status')->nullable()->after('draft_notified_at');
            $table->timestamp('routing_at')->nullable()->after('routing_status');
            $table->uuid('routing_batch_id')->nullable()->after('routing_at');
            $table->string('wp_routing_id')->nullable()->after('routing_batch_id');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->dropColumn(['routing_status', 'routing_at', 'routing_batch_id', 'wp_routing_id']);
        });
    }
};

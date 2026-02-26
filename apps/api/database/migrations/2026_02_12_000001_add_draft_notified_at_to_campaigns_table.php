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
            $table->timestamp('draft_notified_at')->nullable()->after('stats_notified');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->dropColumn('draft_notified_at');
        });
    }
};

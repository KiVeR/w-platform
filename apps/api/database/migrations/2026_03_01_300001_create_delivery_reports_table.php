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
        Schema::create('delivery_reports', function (Blueprint $table): void {
            $table->id();
            $table->string('provider', 20);
            $table->jsonb('report');
            $table->boolean('digested')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->index('provider');
        });

        // Partial index for undigested reports (PostgreSQL)
        DB::statement('CREATE INDEX idx_delivery_reports_undigested ON delivery_reports (digested) WHERE NOT digested');
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_reports');
    }
};

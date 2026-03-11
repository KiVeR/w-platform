<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_request_data', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->jsonb('data');
            $table->timestamp('created_at')->useCurrent();

            $table->index('campaign_id', 'idx_campaign_request_data_campaign');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_request_data');
    }
};

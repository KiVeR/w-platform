<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_recipients', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->uuid('routing_batch_uuid')->nullable();
            $table->string('status', 30)->default('QUEUED');
            $table->string('phone_number');
            $table->text('message_preview')->nullable();
            $table->integer('message_preview_length')->nullable();
            $table->string('short_url_suffix')->nullable();
            $table->string('short_url_slug')->nullable();
            $table->integer('short_url_click')->default(0);
            $table->jsonb('additional_information')->nullable();
            $table->timestampTz('stop_requested_at')->nullable();
            $table->timestampTz('delivered_at')->nullable();
            $table->timestamps();

            $table->unique(['campaign_id', 'short_url_suffix']);
            $table->index(['phone_number', 'routing_batch_uuid']);
            $table->index(['short_url_slug', 'short_url_suffix']);
            $table->index(['campaign_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_recipients');
    }
};

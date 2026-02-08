<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('channel');
            $table->string('status')->default('draft');
            $table->string('name');
            $table->json('targeting')->nullable();
            $table->unsignedInteger('volume_estimated')->nullable();
            $table->unsignedInteger('volume_sent')->nullable();
            $table->text('message')->nullable();
            $table->string('sender', 11)->nullable();
            $table->unsignedInteger('sms_count')->nullable();
            $table->string('short_url')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->decimal('unit_price', 10, 4)->nullable();
            $table->decimal('total_price', 10, 2)->nullable();
            $table->unsignedInteger('fidelisation_file_id')->nullable();
            $table->uuid('trigger_campaign_uuid')->nullable();
            $table->string('adv_operation_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['partner_id', 'type', 'status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};

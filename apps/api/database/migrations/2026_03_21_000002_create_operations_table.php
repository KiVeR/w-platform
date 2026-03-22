<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('demande_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_operation_id')->nullable()->constrained('operations')->nullOnDelete();
            $table->string('ref_operation', 30)->unique();
            $table->unsignedSmallInteger('line_number');
            $table->string('type', 20);
            $table->string('name');
            $table->string('advertiser', 255)->nullable();
            $table->string('priority', 10)->nullable();

            // 4 track statuses
            $table->string('lifecycle_status', 30)->default('draft');
            $table->string('creative_status', 30)->default('not_applicable');
            $table->string('billing_status', 30)->default('not_applicable');
            $table->string('routing_status', 30)->default('not_applicable');

            // Sub-states (metadata)
            $table->string('hold_reason', 50)->nullable();
            $table->string('preparation_step', 30)->nullable();
            $table->string('processing_status', 30)->nullable();
            $table->string('cancellation_type', 30)->nullable();

            // Targeting & volumes
            $table->json('targeting')->nullable();
            $table->unsignedInteger('volume_estimated')->nullable();
            $table->unsignedInteger('volume_sent')->nullable();

            // Pricing
            $table->decimal('unit_price', 10, 4)->nullable();
            $table->decimal('total_price', 10, 2)->nullable();

            // Message & sender
            $table->text('message')->nullable();
            $table->string('sender', 11)->nullable();

            // Assignment
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();

            // External reference
            $table->string('external_ref')->nullable();

            // Scheduling
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Performance indexes
            $table->index(['demande_id', 'lifecycle_status']);
            $table->index(['type', 'lifecycle_status']);
            $table->index(['assigned_to', 'lifecycle_status']);
            $table->index(['lifecycle_status', 'scheduled_at']);
            $table->unique(['demande_id', 'line_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operations');
    }
};

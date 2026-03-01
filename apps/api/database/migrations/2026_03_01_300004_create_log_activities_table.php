<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('log_activities', function (Blueprint $table): void {
            $table->id();
            $table->string('event', 50);
            $table->string('model_type', 100)->nullable();
            $table->unsignedBigInteger('model_id')->nullable();
            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['model_type', 'model_id'], 'idx_log_activities_model');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('log_activities');
    }
};

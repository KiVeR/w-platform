<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operation_transitions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('operation_id')->constrained()->cascadeOnDelete();
            $table->string('track', 20);
            $table->string('from_state', 30);
            $table->string('to_state', 30);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at');
            $table->index(['operation_id', 'track', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_transitions');
    }
};

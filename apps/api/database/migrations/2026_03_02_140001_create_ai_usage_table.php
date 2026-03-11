<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_usage', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('period_key', 7); // '2026-03'
            $table->integer('count')->default(0);
            $table->timestamp('last_generated_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'period_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage');
    }
};

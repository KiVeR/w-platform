<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('targeting_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('partner_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->json('targeting_json');
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamp('last_used_at')->nullable();
            $table->boolean('is_preset')->default(false);
            $table->string('category', 50)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['partner_id', 'is_preset']);
            $table->index(['category', 'is_preset']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('targeting_templates');
    }
};

<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_content_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ai_content_id')->constrained('ai_contents')->cascadeOnDelete();
            $table->string('version', 10);
            $table->jsonb('design');
            $table->integer('widget_count')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->index('ai_content_id', 'idx_versions_content');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_content_versions');
    }
};

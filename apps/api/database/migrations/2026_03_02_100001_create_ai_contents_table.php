<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_contents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('partner_id')->constrained('partners');
            $table->string('type', 20);
            $table->string('title', 255);
            $table->string('status', 20)->default('draft');
            $table->boolean('is_favorite')->default(false);
            $table->jsonb('design')->nullable();
            $table->foreignId('variable_schema_id')->nullable()->constrained('variable_schemas')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index('user_id', 'idx_ai_contents_user');
            $table->index('partner_id', 'idx_ai_contents_partner');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_contents');
    }
};

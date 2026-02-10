<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_pages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('title')->nullable();
            $table->string('status')->default('draft');
            $table->json('design')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('og_title')->nullable();
            $table->text('og_description')->nullable();
            $table->string('og_image_url', 2048)->nullable();
            $table->string('favicon_url', 2048)->nullable();
            $table->unsignedBigInteger('short_url_api_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['partner_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_pages');
    }
};

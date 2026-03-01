<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('short_url_suffixes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('short_url_id')->constrained()->cascadeOnDelete();
            $table->uuid('batch_uuid')->nullable();
            $table->string('slug');
            $table->integer('click_count')->default(0);
            $table->integer('click_count_bots')->default(0);
            $table->timestamps();

            $table->unique(['short_url_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('short_url_suffixes');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('short_urls', function (Blueprint $table) {
            $table->id();
            $table->string('slug');
            $table->text('link')->nullable();
            $table->integer('click_count')->default(0);
            $table->integer('click_count_bots')->default(0);
            $table->boolean('is_draft')->default(false);
            $table->string('import_id')->nullable();
            $table->boolean('is_traceable_by_recipient')->default(false);
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->index(['slug', 'is_enabled']);
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('short_urls');
    }
};

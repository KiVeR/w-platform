<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('short_url_suffix_requests', function (Blueprint $table) {
            $table->id();
            $table->uuid('batch_uuid');
            $table->integer('quantity');
            $table->foreignId('short_url_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('short_url_suffix_requests');
    }
};

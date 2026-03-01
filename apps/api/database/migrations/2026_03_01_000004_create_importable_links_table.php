<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('importable_links', function (Blueprint $table) {
            $table->id();
            $table->uuid()->index();
            $table->integer('count')->nullable();
            $table->boolean('imported')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('importable_links');
    }
};

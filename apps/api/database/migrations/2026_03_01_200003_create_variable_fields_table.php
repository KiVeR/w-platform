<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('variable_fields', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('variable_schema_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_used')->default(false);
            $table->boolean('is_global')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variable_fields');
    }
};

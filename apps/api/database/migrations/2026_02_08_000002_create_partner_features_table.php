<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_features', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->boolean('is_enabled')->default(false);
            $table->timestamps();

            $table->unique(['partner_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_features');
    }
};

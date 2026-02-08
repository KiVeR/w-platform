<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interest_groups', function (Blueprint $table): void {
            $table->id();
            $table->string('label');
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('interest_groups')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interest_groups');
    }
};

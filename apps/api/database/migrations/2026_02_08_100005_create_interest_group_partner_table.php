<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interest_group_partner', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('interest_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['interest_group_id', 'partner_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interest_group_partner');
    }
};

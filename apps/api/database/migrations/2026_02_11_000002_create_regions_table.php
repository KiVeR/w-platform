<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('regions', function (Blueprint $table): void {
            $table->string('code', 3)->primary();
            $table->string('name', 100);
            $table->geography('geometry', 'multipolygon', 4326)->nullable();
            $table->timestamps();

            $table->spatialIndex('geometry');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('regions');
    }
};

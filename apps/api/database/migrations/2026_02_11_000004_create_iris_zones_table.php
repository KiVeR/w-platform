<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('iris_zones', function (Blueprint $table): void {
            $table->string('code', 9)->primary();
            $table->string('name', 200);
            $table->string('department_code', 3);
            $table->string('commune_code', 5);
            $table->string('commune_name', 200);
            $table->char('iris_type', 1);
            $table->geography('geometry', 'multipolygon', 4326)->nullable();
            $table->timestamps();

            $table->foreign('department_code')->references('code')->on('departments');
            $table->index('department_code');
            $table->index('commune_code');
            $table->index('iris_type');
            $table->spatialIndex('geometry');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('iris_zones');
    }
};

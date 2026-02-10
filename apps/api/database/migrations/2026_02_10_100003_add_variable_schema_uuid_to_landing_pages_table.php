<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('landing_pages', function (Blueprint $table): void {
            $table->uuid('variable_schema_uuid')->nullable()->after('short_url_api_id');
        });
    }

    public function down(): void
    {
        Schema::table('landing_pages', function (Blueprint $table): void {
            $table->dropColumn('variable_schema_uuid');
        });
    }
};

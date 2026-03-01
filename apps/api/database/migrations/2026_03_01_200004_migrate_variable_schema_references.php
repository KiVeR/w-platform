<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add variable_schema_id FK to landing_pages
        Schema::table('landing_pages', function (Blueprint $table): void {
            $table->foreignId('variable_schema_id')
                ->nullable()
                ->after('variable_schema_uuid')
                ->constrained()
                ->nullOnDelete();
        });

        // Migrate existing data: lookup variable_schema by uuid
        DB::statement(<<<'SQL'
            UPDATE landing_pages
            SET variable_schema_id = vs.id
            FROM variable_schemas vs
            WHERE landing_pages.variable_schema_uuid = vs.uuid
              AND landing_pages.variable_schema_uuid IS NOT NULL
        SQL);

        // Drop old column
        Schema::table('landing_pages', function (Blueprint $table): void {
            $table->dropColumn('variable_schema_uuid');
        });

        // Add variable_schema_id FK to campaigns
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->foreignId('variable_schema_id')
                ->nullable()
                ->after('landing_page_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('variable_schema_id');
        });

        Schema::table('landing_pages', function (Blueprint $table): void {
            $table->uuid('variable_schema_uuid')->nullable()->after('short_url_api_id');
        });

        // Migrate data back
        DB::statement(<<<'SQL'
            UPDATE landing_pages
            SET variable_schema_uuid = vs.uuid
            FROM variable_schemas vs
            WHERE landing_pages.variable_schema_id = vs.id
              AND landing_pages.variable_schema_id IS NOT NULL
        SQL);

        Schema::table('landing_pages', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('variable_schema_id');
        });
    }
};

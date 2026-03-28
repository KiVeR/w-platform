<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('targeting_templates', function (Blueprint $table) {
            $table->string('targeting_hash', 32)->nullable()->index()->after('targeting_json');
        });
    }

    public function down(): void
    {
        Schema::table('targeting_templates', function (Blueprint $table) {
            $table->dropIndex(['targeting_hash']);
            $table->dropColumn('targeting_hash');
        });
    }
};

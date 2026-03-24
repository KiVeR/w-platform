<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('operations', function (Blueprint $table) {
            $table->timestamp('last_transitioned_at')->nullable()->after('status');
            $table->index('last_transitioned_at');
        });
    }

    public function down(): void
    {
        Schema::table('operations', function (Blueprint $table) {
            $table->dropIndex(['last_transitioned_at']);
            $table->dropColumn('last_transitioned_at');
        });
    }
};

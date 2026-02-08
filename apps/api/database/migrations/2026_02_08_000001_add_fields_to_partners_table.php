<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table): void {
            $table->string('email')->nullable()->after('is_active');
            $table->string('phone')->nullable()->after('email');
            $table->string('address')->nullable()->after('phone');
            $table->string('city')->nullable()->after('address');
            $table->string('zip_code', 10)->nullable()->after('city');
            $table->string('logo_url')->nullable()->after('zip_code');
            $table->integer('sms_credits')->default(0)->after('logo_url');
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table): void {
            $table->dropColumn([
                'email',
                'phone',
                'address',
                'city',
                'zip_code',
                'logo_url',
                'sms_credits',
            ]);
        });
    }
};

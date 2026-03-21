<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commercial_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('sdr_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ref_demande', 20)->unique();
            $table->string('ref_client', 100)->nullable();
            $table->text('information')->nullable();
            $table->boolean('is_exoneration')->default(false);
            $table->string('pays_id', 2)->default('FR');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['partner_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes');
    }
};

<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // No separate `payments` table — paid_at + payment_method live on invoices.
        // `overdue` is NOT a stored status — computed frontend-side from due_date + status.
        Schema::create('invoices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('partner_id')->constrained()->restrictOnDelete();
            $table->foreignId('credited_invoice_id')->nullable()->references('id')->on('invoices')->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->date('invoice_date');
            $table->date('due_date');
            $table->decimal('subtotal_ht', 12, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(20);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total_ttc', 12, 2)->default(0);
            $table->string('status', 20)->default('draft'); // InvoiceStatus enum
            $table->text('notes')->nullable();
            $table->string('pdf_path')->nullable(); // deferred — no DomPDF in MVP
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['partner_id', 'status']);
            $table->index(['status', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};

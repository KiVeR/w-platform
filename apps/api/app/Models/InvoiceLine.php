<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\InvoiceLineFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceLine extends Model
{
    /** @use HasFactory<InvoiceLineFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'invoice_id',
        'operation_id',
        'description',
        'quantity',
        'unit_price',
        'total_ht',
        'tax_rate',
        'tax_amount',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'quantity'   => 'integer',
            'unit_price' => 'decimal:4',
            'total_ht'   => 'decimal:2',
            'tax_rate'   => 'decimal:2',
            'tax_amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /** @return BelongsTo<Operation, $this> */
    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }
}

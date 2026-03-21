<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\TransactionType;
use Database\Factories\TransactionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class Transaction extends Model
{
    /** @use HasFactory<TransactionFactory> */
    use HasFactory;

    /** Append-only ledger: no updated_at column. */
    public const UPDATED_AT = null;

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'operation_id',
        'type',
        'amount',
        'balance_after',
        'description',
        'reference',
        'metadata',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type'          => TransactionType::class,
            'amount'        => 'decimal:2',
            'balance_after' => 'decimal:2',
            'metadata'      => 'array',
            'created_at'    => 'datetime',
        ];
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return BelongsTo<Operation, $this> */
    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }

    /**
     * @param array<string, mixed> $attributes
     * @param array<string, mixed> $options
     */
    public function update(array $attributes = [], array $options = []): never
    {
        throw new LogicException('Transactions are immutable and cannot be updated.');
    }

    public function delete(): never
    {
        throw new LogicException('Transactions are immutable and cannot be deleted.');
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\DeliveryReportFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $provider
 * @property array<string, mixed> $report
 * @property bool $digested
 * @property \Illuminate\Support\Carbon $created_at
 */
class DeliveryReport extends Model
{
    /** @use HasFactory<DeliveryReportFactory> */
    use HasFactory;

    public $timestamps = false;

    /** @var list<string> */
    protected $fillable = [
        'provider',
        'report',
        'digested',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'report' => 'array',
            'digested' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    /** @param Builder<DeliveryReport> $query */
    public function scopeUndigested(Builder $query): void
    {
        $query->where('digested', false);
    }

    /** @param Builder<DeliveryReport> $query */
    public function scopeForProvider(Builder $query, string $provider): void
    {
        $query->where('provider', $provider);
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\PartnerPricingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerPricing extends Model
{
    /** @use HasFactory<PartnerPricingFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'name',
        'volume_min',
        'volume_max',
        'router_price',
        'data_price',
        'ci_price',
        'is_active',
        'is_default',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'volume_min' => 'integer',
            'volume_max' => 'integer',
            'router_price' => 'float',
            'data_price' => 'float',
            'ci_price' => 'float',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
        ];
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}

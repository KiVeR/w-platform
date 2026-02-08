<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PartnerFeatureKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerFeature extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'key',
        'is_enabled',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'key' => PartnerFeatureKey::class,
            'is_enabled' => 'boolean',
        ];
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}

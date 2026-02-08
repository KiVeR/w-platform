<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\InterestGroupFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InterestGroup extends Model
{
    /** @use HasFactory<InterestGroupFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'label',
        'description',
        'parent_id',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<self, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** @return HasMany<self, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /** @return HasMany<Interest, $this> */
    public function interests(): HasMany
    {
        return $this->hasMany(Interest::class);
    }

    /** @return BelongsToMany<Campaign, $this> */
    public function campaigns(): BelongsToMany
    {
        return $this->belongsToMany(Campaign::class, 'campaign_interest_group')
            ->withPivot(['index', 'operator'])
            ->withTimestamps();
    }

    /** @return BelongsToMany<Partner, $this> */
    public function hiddenForPartners(): BelongsToMany
    {
        return $this->belongsToMany(Partner::class, 'interest_group_partner')
            ->withTimestamps();
    }
}

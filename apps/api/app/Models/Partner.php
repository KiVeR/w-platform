<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PartnerFeatureKey;
use Database\Factories\PartnerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Partner extends Model
{
    /** @use HasFactory<PartnerFactory> */
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    protected $fillable = [
        'name',
        'code',
        'is_active',
        'email',
        'phone',
        'address',
        'city',
        'zip_code',
        'logo_url',
        'euro_credits',
        'router_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'euro_credits' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Router, $this> */
    public function router(): BelongsTo
    {
        return $this->belongsTo(Router::class);
    }

    /** @return HasMany<User, $this> */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** @return HasMany<Shop, $this> */
    public function shops(): HasMany
    {
        return $this->hasMany(Shop::class);
    }

    /** @return HasMany<Campaign, $this> */
    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    /** @return HasMany<PartnerPricing, $this> */
    public function pricings(): HasMany
    {
        return $this->hasMany(PartnerPricing::class);
    }

    /** @return HasMany<LandingPage, $this> */
    public function landingPages(): HasMany
    {
        return $this->hasMany(LandingPage::class);
    }

    /** @return HasMany<PartnerFeature, $this> */
    public function features(): HasMany
    {
        return $this->hasMany(PartnerFeature::class);
    }

    public function hasFeature(PartnerFeatureKey $key): bool
    {
        return $this->features()
            ->where('key', $key->value)
            ->where('is_enabled', true)
            ->exists();
    }
}

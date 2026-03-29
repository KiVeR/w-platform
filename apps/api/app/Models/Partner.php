<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BillingMode;
use App\Enums\PartnerFeatureKey;
use Database\Factories\PartnerFactory;
use Illuminate\Database\Eloquent\Builder;
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
        'adv_id',
        'activity_type',
        'billing_mode',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'euro_credits' => 'decimal:2',
            'billing_mode' => BillingMode::class,
        ];
    }

    /** @return BelongsTo<Router, $this> */
    public function router(): BelongsTo
    {
        return $this->belongsTo(Router::class);
    }

    /** @return BelongsTo<User, $this> */
    public function adv(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adv_id');
    }

    /** @param Builder<Partner> $query */
    public function scopeForUser(Builder $query, User $user): void
    {
        if ($user->hasRole('admin')) {
            return;
        }

        if ($user->hasRole('adv')) {
            $query->where('adv_id', $user->id);

            return;
        }

        $query->where('id', $user->partner_id);
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

    /** @return HasMany<Demande, $this> */
    public function demandes(): HasMany
    {
        return $this->hasMany(Demande::class);
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

    /** @return HasMany<TargetingTemplate, $this> */
    public function targetingTemplates(): HasMany
    {
        return $this->hasMany(TargetingTemplate::class);
    }

    /** @return HasMany<VariableSchema, $this> */
    public function variableSchemas(): HasMany
    {
        return $this->hasMany(VariableSchema::class);
    }

    /** @return HasMany<PartnerFeature, $this> */
    public function features(): HasMany
    {
        return $this->hasMany(PartnerFeature::class);
    }

    /** @return HasMany<Transaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /** @return HasMany<Invoice, $this> */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function hasFeature(PartnerFeatureKey $key): bool
    {
        return $this->features()
            ->where('key', $key->value)
            ->where('is_enabled', true)
            ->exists();
    }
}

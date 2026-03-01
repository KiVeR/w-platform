<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\VariableSchemaFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @property string $uuid
 * @property int $partner_id
 * @property string $name
 * @property array<string, mixed>|null $global_data
 * @property array<string, mixed>|null $recipient_preview_data
 */
class VariableSchema extends Model
{
    /** @use HasFactory<VariableSchemaFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'uuid',
        'partner_id',
        'name',
        'global_data',
        'recipient_preview_data',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'global_data' => 'array',
            'recipient_preview_data' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (VariableSchema $schema): void {
            if (empty($schema->uuid)) {
                $schema->uuid = (string) Str::uuid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /** @param Builder<VariableSchema> $query */
    public function scopeForUser(Builder $query, User $user): void
    {
        if (! $user->hasRole('admin')) {
            $query->where('partner_id', $user->partner_id);
        }
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return HasMany<VariableField, $this> */
    public function variableFields(): HasMany
    {
        return $this->hasMany(VariableField::class);
    }

    /** @return HasMany<Campaign, $this> */
    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    /** @return HasMany<LandingPage, $this> */
    public function landingPages(): HasMany
    {
        return $this->hasMany(LandingPage::class);
    }
}

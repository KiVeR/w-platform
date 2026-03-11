<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\LandingPageStatus;
use Database\Factories\LandingPageFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property LandingPageStatus $status
 * @property array<string, mixed>|null $design
 * @property bool $is_active
 * @property int|null $short_url_api_id
 * @property int|null $variable_schema_id
 */
class LandingPage extends Model
{
    /** @use HasFactory<LandingPageFactory> */
    use HasFactory, SoftDeletes;

    /** @var array<string, string> */
    protected $attributes = [
        'status' => 'draft',
    ];

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'user_id',
        'name',
        'title',
        'status',
        'design',
        'is_active',
        'og_title',
        'og_description',
        'og_image_url',
        'favicon_url',
        'short_url_api_id',
        'variable_schema_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => LandingPageStatus::class,
            'design' => 'array',
            'is_active' => 'boolean',
            'short_url_api_id' => 'integer',
        ];
    }

    /** @param Builder<LandingPage> $query */
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

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<VariableSchema, $this> */
    public function variableSchema(): BelongsTo
    {
        return $this->belongsTo(VariableSchema::class);
    }

    /** @return HasMany<Campaign, $this> */
    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use Database\Factories\AIContentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AIContent extends Model
{
    /** @use HasFactory<AIContentFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'ai_contents';

    protected $attributes = ['status' => 'draft'];

    protected $fillable = [
        'user_id',
        'partner_id',
        'type',
        'title',
        'status',
        'is_favorite',
        'design',
        'variable_schema_id',
    ];

    protected function casts(): array
    {
        return [
            'type' => ContentType::class,
            'status' => ContentStatus::class,
            'is_favorite' => 'boolean',
            'design' => 'array',
        ];
    }

    /** @param Builder<AIContent> $query */
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

    /** @return HasMany<AIContentVersion, $this> */
    public function versions(): HasMany
    {
        return $this->hasMany(AIContentVersion::class, 'ai_content_id')->orderByDesc('id');
    }
}

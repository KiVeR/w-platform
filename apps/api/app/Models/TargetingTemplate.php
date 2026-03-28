<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\TargetingTemplateFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property array<string, mixed> $targeting_json
 * @property string|null $targeting_hash
 * @property bool $is_preset
 * @property \Illuminate\Support\Carbon|null $last_used_at
 * @property int|null $partner_id
 */
class TargetingTemplate extends Model
{
    /** @use HasFactory<TargetingTemplateFactory> */
    use HasFactory, SoftDeletes;

    /** @var array<string, string|int|bool> */
    protected $attributes = [
        'is_preset' => false,
        'usage_count' => 0,
    ];

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'name',
        'targeting_json',
        'targeting_hash',
        'usage_count',
        'last_used_at',
        'is_preset',
        'category',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'targeting_json' => 'array',
            'is_preset' => 'boolean',
            'last_used_at' => 'datetime',
            'usage_count' => 'integer',
        ];
    }

    /** @param Builder<TargetingTemplate> $query */
    public function scopeForUser(Builder $query, User $user): void
    {
        if (! $user->hasRole('admin')) {
            $query->where('partner_id', $user->partner_id);
        }
    }

    /** @param Builder<TargetingTemplate> $query */
    public function scopePresets(Builder $query): void
    {
        $query->where('is_preset', true);
    }

    /** @param Builder<TargetingTemplate> $query */
    public function scopeByCategory(Builder $query, string $category): void
    {
        $query->where('category', $category);
    }

    public function getTargetingHash(): string
    {
        $targeting = $this->targeting_json;
        ksort($targeting);

        return md5((string) json_encode($targeting));
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}

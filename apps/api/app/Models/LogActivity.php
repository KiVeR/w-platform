<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\LogActivityFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $id
 * @property string $event
 * @property string|null $model_type
 * @property int|null $model_id
 * @property array<string, mixed>|null $old_values
 * @property array<string, mixed>|null $new_values
 * @property \Illuminate\Support\Carbon $created_at
 */
class LogActivity extends Model
{
    /** @use HasFactory<LogActivityFactory> */
    use HasFactory;

    public $timestamps = false;

    /** @var list<string> */
    protected $fillable = [
        'event',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /** @return MorphTo<Model, $this> */
    public function model(): MorphTo
    {
        return $this->morphTo();
    }

    /** @param Builder<LogActivity> $query */
    public function scopeForModel(Builder $query, string $modelType, int $modelId): void
    {
        $query->where('model_type', $modelType)->where('model_id', $modelId);
    }
}

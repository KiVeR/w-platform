<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\VariableFieldFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $variable_schema_id
 * @property string $name
 * @property bool $is_used
 * @property bool $is_global
 */
class VariableField extends Model
{
    /** @use HasFactory<VariableFieldFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'variable_schema_id',
        'name',
        'is_used',
        'is_global',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_used' => 'boolean',
            'is_global' => 'boolean',
        ];
    }

    /** @return BelongsTo<VariableSchema, $this> */
    public function variableSchema(): BelongsTo
    {
        return $this->belongsTo(VariableSchema::class);
    }
}

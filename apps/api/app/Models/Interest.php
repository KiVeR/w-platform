<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\InterestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Interest extends Model
{
    /** @use HasFactory<InterestFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'wellpack_id',
        'label',
        'type',
        'interest_group_id',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'wellpack_id' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<InterestGroup, $this> */
    public function group(): BelongsTo
    {
        return $this->belongsTo(InterestGroup::class, 'interest_group_id');
    }
}

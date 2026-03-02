<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIUsage extends Model
{
    protected $table = 'ai_usage';

    protected $fillable = [
        'user_id',
        'period_key',
        'count',
        'last_generated_at',
    ];

    protected function casts(): array
    {
        return [
            'count' => 'integer',
            'last_generated_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

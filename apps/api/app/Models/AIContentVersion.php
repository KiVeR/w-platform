<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIContentVersion extends Model
{
    public $timestamps = true;

    /** @var null */
    const UPDATED_AT = null;

    protected $table = 'ai_content_versions';

    protected $fillable = [
        'ai_content_id',
        'version',
        'design',
        'widget_count',
    ];

    protected function casts(): array
    {
        return [
            'design' => 'array',
            'widget_count' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<AIContent, $this> */
    public function aiContent(): BelongsTo
    {
        return $this->belongsTo(AIContent::class, 'ai_content_id');
    }
}

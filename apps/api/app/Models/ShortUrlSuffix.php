<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ShortUrlSuffixFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShortUrlSuffix extends Model
{
    /** @use HasFactory<ShortUrlSuffixFactory> */
    use HasFactory;

    protected $fillable = [
        'short_url_id',
        'batch_uuid',
        'slug',
        'click_count',
        'click_count_bots',
    ];

    protected $casts = [
        'click_count' => 'integer',
        'click_count_bots' => 'integer',
    ];

    /** @return BelongsTo<ShortUrl, $this> */
    public function shortUrl(): BelongsTo
    {
        return $this->belongsTo(ShortUrl::class);
    }

    public function incrementClickCount(bool $isBot): void
    {
        if ($isBot) {
            $this->increment('click_count_bots');
        } else {
            $this->increment('click_count');
        }
    }
}

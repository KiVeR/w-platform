<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ShortUrl extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $casts = [
        'id' => 'integer',
        'is_draft' => 'boolean',
        'click_count' => 'integer',
        'click_count_bots' => 'integer',
        'is_traceable_by_recipient' => 'boolean',
        'is_enabled' => 'boolean',
    ];

    public function suffixes(): HasMany
    {
        return $this->hasMany(ShortUrlSuffix::class);
    }

    public function shortUrlSuffixRequests(): HasMany
    {
        return $this->hasMany(ShortUrlSuffixRequest::class);
    }

    public static function findByIdOrSlug(int|string $shortUrlIdOrSlug): Builder
    {
        $query = self::query();

        if (is_numeric($shortUrlIdOrSlug)) {
            return $query->where('id', $shortUrlIdOrSlug);
        }

        return $query->where('slug', $shortUrlIdOrSlug);
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

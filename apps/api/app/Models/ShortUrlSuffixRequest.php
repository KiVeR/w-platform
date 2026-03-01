<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShortUrlSuffixRequest extends Model
{
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'quantity',
        'short_url_id',
        'batch_uuid',
    ];

    /** @return BelongsTo<ShortUrl, $this> */
    public function shortUrl(): BelongsTo
    {
        return $this->belongsTo(ShortUrl::class);
    }
}

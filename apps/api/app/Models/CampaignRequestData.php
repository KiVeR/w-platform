<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CampaignRequestDataFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $campaign_id
 * @property array<string, mixed> $data
 * @property \Illuminate\Support\Carbon $created_at
 */
class CampaignRequestData extends Model
{
    /** @use HasFactory<CampaignRequestDataFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $table = 'campaign_request_data';

    /** @var list<string> */
    protected $fillable = [
        'campaign_id',
        'data',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Campaign, $this> */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}

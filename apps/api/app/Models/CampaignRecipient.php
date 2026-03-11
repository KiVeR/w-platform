<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CampaignRecipientStatus;
use Database\Factories\CampaignRecipientFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $campaign_id
 * @property string|null $routing_batch_uuid
 * @property CampaignRecipientStatus $status
 * @property string $phone_number
 * @property string|null $message_preview
 * @property int|null $message_preview_length
 * @property string|null $short_url_suffix
 * @property string|null $short_url_slug
 * @property int $short_url_click
 * @property array<string, mixed>|null $additional_information
 * @property \Illuminate\Support\Carbon|null $stop_requested_at
 * @property \Illuminate\Support\Carbon|null $delivered_at
 */
class CampaignRecipient extends Model
{
    /** @use HasFactory<CampaignRecipientFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'campaign_id',
        'routing_batch_uuid',
        'status',
        'phone_number',
        'message_preview',
        'message_preview_length',
        'short_url_suffix',
        'short_url_slug',
        'additional_information',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => CampaignRecipientStatus::class,
            'additional_information' => 'array',
            'stop_requested_at' => 'datetime',
            'delivered_at' => 'datetime',
            'short_url_click' => 'integer',
            'message_preview_length' => 'integer',
        ];
    }

    /** @return BelongsTo<Campaign, $this> */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    /** @param Builder<CampaignRecipient> $query */
    public function scopeQueued(Builder $query): void
    {
        $query->where('status', CampaignRecipientStatus::Queued);
    }

    /** @param Builder<CampaignRecipient> $query */
    public function scopeForBatch(Builder $query, string $batchUuid): void
    {
        $query->where('routing_batch_uuid', $batchUuid);
    }

    /**
     * Get merged additional information including global variable data.
     *
     * @return array<string, mixed>
     */
    public function getMergedAdditionalInformation(): array
    {
        $info = $this->additional_information ?? [];
        $globalKey = $info['global_parameters_key'] ?? null;
        unset($info['global_parameters_key']);

        if ($globalKey === null) {
            return $info;
        }

        $schema = $this->campaign?->variableSchema;
        /** @var array<string, mixed> $globalData */
        $globalData = ($schema !== null && method_exists($schema, 'getGlobalDataByKey'))
            ? $schema->getGlobalDataByKey($globalKey)
            : [];

        return array_merge($globalData, $info);
    }
}

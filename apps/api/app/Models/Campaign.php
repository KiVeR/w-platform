<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CampaignChannel;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use Database\Factories\CampaignFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property CampaignType $type
 * @property CampaignChannel $channel
 * @property CampaignStatus $status
 * @property array<string, mixed>|null $targeting
 * @property bool $is_demo
 * @property string|null $additional_phone
 * @property int|null $volume_estimated
 * @property int|null $partner_id
 * @property float|null $total_price
 * @property \Illuminate\Support\Carbon|null $sent_at
 */
class Campaign extends Model
{
    /** @use HasFactory<CampaignFactory> */
    use HasFactory, SoftDeletes;

    /** @var array<string, string> */
    protected $attributes = [
        'status' => 'draft',
    ];

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'user_id',
        'type',
        'channel',
        'status',
        'is_demo',
        'name',
        'targeting',
        'volume_estimated',
        'volume_sent',
        'message',
        'sender',
        'additional_phone',
        'sms_count',
        'short_url',
        'scheduled_at',
        'sent_at',
        'unit_price',
        'total_price',
        'fidelisation_file_id',
        'trigger_campaign_uuid',
        'external_id',
        'error_message',
        'stats_notified',
        'adv_operation_id',
        'landing_page_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => CampaignType::class,
            'channel' => CampaignChannel::class,
            'status' => CampaignStatus::class,
            'is_demo' => 'boolean',
            'targeting' => 'array',
            'volume_estimated' => 'integer',
            'volume_sent' => 'integer',
            'sms_count' => 'integer',
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
            'unit_price' => 'float',
            'total_price' => 'float',
            'stats_notified' => 'boolean',
        ];
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsToMany<InterestGroup, $this> */
    public function interestGroups(): BelongsToMany
    {
        return $this->belongsToMany(InterestGroup::class, 'campaign_interest_group')
            ->withPivot(['index', 'operator'])
            ->withTimestamps();
    }

    /** @return BelongsTo<LandingPage, $this> */
    public function landingPage(): BelongsTo
    {
        return $this->belongsTo(LandingPage::class);
    }

    /** @param Builder<Campaign> $query */
    public function scopeForUser(Builder $query, User $user): void
    {
        if (! $user->hasRole('admin')) {
            $query->where('partner_id', $user->partner_id);
        }
    }

    public function getTargetingVolume(): int
    {
        $targeting = $this->targeting;

        if (! is_array($targeting) || ! isset($targeting['geo']['postcodes']) || ! is_array($targeting['geo']['postcodes'])) {
            return 0;
        }

        $volume = 0;

        foreach ($targeting['geo']['postcodes'] as $postcode) {
            $volume += (int) ($postcode['volume'] ?? 0);
        }

        return $volume;
    }
}

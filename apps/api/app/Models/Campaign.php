<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CampaignChannel;
use App\Enums\CampaignRoutingStatus;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use Database\Factories\CampaignFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property CampaignType $type
 * @property CampaignChannel $channel
 * @property CampaignStatus $status
 * @property CampaignRoutingStatus|null $routing_status
 * @property array<string, mixed>|null $targeting
 * @property bool $is_demo
 * @property string|null $additional_phone
 * @property int|null $volume_estimated
 * @property int|null $partner_id
 * @property float|null $total_price
 * @property \Illuminate\Support\Carbon|null $sent_at
 * @property \Illuminate\Support\Carbon|null $draft_notified_at
 * @property \Illuminate\Support\Carbon|null $routing_at
 * @property \Illuminate\Support\Carbon|null $routing_executed_at
 * @property string|null $routing_batch_id
 * @property string|null $wp_routing_id
 * @property int|null $operation_id
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
        'variable_schema_id',
        'draft_notified_at',
        'router_id',
        'routing_status',
        'routing_at',
        'routing_executed_at',
        'routing_batch_id',
        'wp_routing_id',
        'operation_id',
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
            'draft_notified_at' => 'datetime',
            'routing_status' => CampaignRoutingStatus::class,
            'routing_at' => 'datetime',
            'routing_executed_at' => 'datetime',
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

    /** @return BelongsTo<VariableSchema, $this> */
    public function variableSchema(): BelongsTo
    {
        return $this->belongsTo(VariableSchema::class);
    }

    /** @return BelongsTo<Router, $this> */
    public function router(): BelongsTo
    {
        return $this->belongsTo(Router::class);
    }

    /** @return BelongsTo<Operation, $this> */
    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }

    /** @return HasMany<CampaignRecipient, $this> */
    public function campaignRecipients(): HasMany
    {
        return $this->hasMany(CampaignRecipient::class);
    }

    /** @return HasMany<CampaignLog, $this> */
    public function campaignLogs(): HasMany
    {
        return $this->hasMany(CampaignLog::class);
    }

    /** @return HasMany<CampaignRequestData, $this> */
    public function campaignRequestData(): HasMany
    {
        return $this->hasMany(CampaignRequestData::class);
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

        if (! is_array($targeting)) {
            return 0;
        }

        // Canonical format: zones[]
        if (isset($targeting['zones']) && is_array($targeting['zones'])) {
            return (int) collect($targeting['zones'])->sum(fn (array $zone) => (int) ($zone['volume'] ?? 0));
        }

        // Legacy format: geo.postcodes[]
        if (isset($targeting['geo']['postcodes']) && is_array($targeting['geo']['postcodes'])) {
            return (int) collect($targeting['geo']['postcodes'])->sum(fn (array $pc) => (int) ($pc['volume'] ?? 0));
        }

        return 0;
    }
}

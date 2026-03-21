<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BillingStatus;
use App\Enums\CancellationType;
use App\Enums\CreativeStatus;
use App\Enums\HoldReason;
use App\Enums\LifecycleStatus;
use App\Enums\OperationRoutingStatus;
use App\Enums\OperationType;
use App\Enums\PreparationStep;
use App\Enums\Priority;
use App\Enums\ProcessingStatus;
use Database\Factories\OperationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Operation extends Model
{
    /** @use HasFactory<OperationFactory> */
    use HasFactory, SoftDeletes;

    /** @var array<string, string> */
    protected $attributes = [
        'lifecycle_status'  => 'draft',
        'creative_status'   => 'not_applicable',
        'billing_status'    => 'not_applicable',
        'routing_status'    => 'not_applicable',
    ];

    /** @var list<string> */
    protected $fillable = [
        'demande_id',
        'parent_operation_id',
        'ref_operation',
        'line_number',
        'type',
        'name',
        'advertiser',
        'priority',
        'lifecycle_status',
        'creative_status',
        'billing_status',
        'routing_status',
        'hold_reason',
        'preparation_step',
        'processing_status',
        'cancellation_type',
        'targeting',
        'volume_estimated',
        'volume_sent',
        'unit_price',
        'total_price',
        'message',
        'sender',
        'assigned_to',
        'external_ref',
        'scheduled_at',
        'delivered_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type'               => OperationType::class,
            'priority'           => Priority::class,
            'lifecycle_status'   => LifecycleStatus::class,
            'creative_status'    => CreativeStatus::class,
            'billing_status'     => BillingStatus::class,
            'routing_status'     => OperationRoutingStatus::class,
            'hold_reason'        => HoldReason::class,
            'preparation_step'   => PreparationStep::class,
            'processing_status'  => ProcessingStatus::class,
            'cancellation_type'  => CancellationType::class,
            'targeting'          => 'array',
            'volume_estimated'   => 'integer',
            'volume_sent'        => 'integer',
            'unit_price'         => 'float',
            'total_price'        => 'float',
            'scheduled_at'       => 'datetime',
            'delivered_at'       => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $operation): void {
            if (empty($operation->ref_operation)) {
                $operation->ref_operation = static::generateRefOperation();
            }

            if (empty($operation->line_number)) {
                $operation->line_number = static::where('demande_id', $operation->demande_id)->max('line_number') + 1;
            }

            $operation->initializeTrackStatuses();
        });
    }

    public static function generateRefOperation(): string
    {
        $date = now()->format('ymd');
        $maxAttempts = 10;

        for ($i = 0; $i < $maxAttempts; $i++) {
            $suffix = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 6));
            $ref = "OP-{$date}-{$suffix}";

            if (! static::where('ref_operation', $ref)->exists()) {
                return $ref;
            }
        }

        return 'OP-' . $date . '-' . strtoupper(substr(md5(uniqid('', true)), 0, 6));
    }

    public function initializeTrackStatuses(): void
    {
        $type = $this->type instanceof OperationType
            ? $this->type
            : OperationType::from((string) $this->type);

        if (! $type->requiresCreative()) {
            $this->creative_status = CreativeStatus::NOT_APPLICABLE;
        } elseif ($this->creative_status === CreativeStatus::NOT_APPLICABLE) {
            $this->creative_status = CreativeStatus::PENDING;
        }

        if (! $type->requiresBilling()) {
            $this->billing_status = BillingStatus::NOT_APPLICABLE;
        } elseif ($this->billing_status === BillingStatus::NOT_APPLICABLE) {
            $this->billing_status = BillingStatus::PENDING;
        }

        if (! $type->requiresRouting()) {
            $this->routing_status = OperationRoutingStatus::NOT_APPLICABLE;
        } elseif ($this->routing_status === OperationRoutingStatus::NOT_APPLICABLE) {
            $this->routing_status = OperationRoutingStatus::PENDING;
        }
    }

    /** @return BelongsTo<Demande, $this> */
    public function demande(): BelongsTo
    {
        return $this->belongsTo(Demande::class);
    }

    /** @return HasOne<Campaign, $this> */
    public function campaign(): HasOne
    {
        return $this->hasOne(Campaign::class);
    }

    /** @return BelongsTo<Operation, $this> */
    public function parentOperation(): BelongsTo
    {
        return $this->belongsTo(Operation::class, 'parent_operation_id');
    }

    /** @return HasMany<Operation, $this> */
    public function childOperations(): HasMany
    {
        return $this->hasMany(Operation::class, 'parent_operation_id');
    }

    /** @return HasMany<OperationTransition, $this> */
    public function transitions(): HasMany
    {
        return $this->hasMany(OperationTransition::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /** @param Builder<Operation> $query */
    public function scopeForUser(Builder $query, User $user): void
    {
        if (! $user->hasRole('admin')) {
            $query->whereHas('demande', fn (Builder $q) => $q->where('partner_id', $user->partner_id));
        }
    }

    /** @param Builder<Operation> $query */
    public function scopeActive(Builder $query): void
    {
        $query->whereNotIn('lifecycle_status', [
            LifecycleStatus::COMPLETED->value,
            LifecycleStatus::CANCELLED->value,
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BillingStatus;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Enums\CancellationType;
use App\Enums\LifecycleStatus;
use App\Enums\OperationType;
use App\Models\Campaign;
use App\Models\Demande;
use App\Models\Operation;
use App\Services\StateMachine\TransitionService;
use Illuminate\Support\Facades\DB;

final class SelfServiceOrchestrator
{
    public function __construct(
        private readonly TransitionService $transitionService,
    ) {}

    /**
     * Auto-create a Demande + Operation for a newly created Campaign.
     * Returns null if the campaign is already linked, is demo, or has no partner.
     */
    public function createFromCampaign(Campaign $campaign): ?Operation
    {
        if ($campaign->operation_id !== null) {
            return null;
        }

        if ($campaign->is_demo) {
            return null;
        }

        if ($campaign->partner_id === null) {
            return null;
        }

        $demande = $this->findOrCreateDemande($campaign->partner_id);

        $operation = Operation::create([
            'demande_id' => $demande->id,
            'type' => $this->mapCampaignTypeToOperationType($campaign->type)->value,
            'name' => $campaign->name ?? 'Campagne self-service',
            'targeting' => $campaign->targeting,
            'volume_estimated' => $campaign->volume_estimated,
            'unit_price' => $campaign->unit_price,
            'total_price' => $campaign->total_price,
            'message' => $campaign->message,
            'sender' => $campaign->sender,
            'scheduled_at' => $campaign->scheduled_at,
        ]);

        Campaign::withoutEvents(function () use ($campaign, $operation): void {
            $campaign->update(['operation_id' => $operation->id]);
        });

        return $operation;
    }

    /**
     * Sync operation data fields when campaign targeting/volumes/pricing/message change.
     * Only updates if values actually differ (dirty check).
     */
    public function syncOperationFromCampaign(Campaign $campaign): void
    {
        if ($campaign->operation_id === null) {
            return;
        }

        /** @var Operation|null $operation */
        $operation = Operation::find($campaign->operation_id);

        if ($operation === null) {
            return;
        }

        if ($operation->lifecycle_status->isTerminal()) {
            return;
        }

        $syncFields = [
            'targeting' => $campaign->targeting,
            'volume_estimated' => $campaign->volume_estimated,
            'unit_price' => $campaign->unit_price,
            'total_price' => $campaign->total_price,
            'message' => $campaign->message,
            'sender' => $campaign->sender,
            'scheduled_at' => $campaign->scheduled_at,
        ];

        $dirty = [];
        foreach ($syncFields as $field => $value) {
            $current = $operation->getAttribute($field);

            if ($field === 'targeting') {
                if (json_encode($current) !== json_encode($value)) {
                    $dirty[$field] = $value;
                }
            } elseif ($field === 'scheduled_at') {
                $currentStr = $current instanceof \DateTimeInterface ? $current->format('Y-m-d H:i:s') : null;
                $valueStr = $value instanceof \DateTimeInterface ? $value->format('Y-m-d H:i:s') : null;
                if ($currentStr !== $valueStr) {
                    $dirty[$field] = $value;
                }
            } else {
                // Cast to string for comparison to handle int/float differences
                if ((string) $current !== (string) $value) {
                    $dirty[$field] = $value;
                }
            }
        }

        if ($dirty !== []) {
            $operation->update($dirty);
        }
    }

    /**
     * Dispatch lifecycle transitions based on campaign status change.
     */
    public function handleStatusChange(Campaign $campaign): void
    {
        if ($campaign->operation_id === null) {
            return;
        }

        /** @var Operation|null $operation */
        $operation = Operation::find($campaign->operation_id);

        if ($operation === null) {
            return;
        }

        // Data ops follow a simplified path
        if ($operation->type->isDataOp()) {
            $this->handleDataOpStatusChange($campaign, $operation);

            return;
        }

        match ($campaign->status) {
            CampaignStatus::SCHEDULED => $this->advanceToScheduled($operation),
            CampaignStatus::SENDING => $this->advanceOnSend($operation),
            CampaignStatus::SENT => $this->advanceOnComplete($operation),
            CampaignStatus::CANCELLED => $this->advanceOnCancel($operation),
            CampaignStatus::FAILED => $this->advanceOnFail($operation),
            default => null,
        };
    }

    /**
     * Cancel the operation linked to a deleted campaign.
     */
    public function handleCampaignDeleted(Campaign $campaign): void
    {
        if ($campaign->operation_id === null) {
            return;
        }

        /** @var Operation|null $operation */
        $operation = Operation::find($campaign->operation_id);

        if ($operation === null) {
            return;
        }

        if ($operation->lifecycle_status->isTerminal()) {
            return;
        }

        $this->advanceOnCancel($operation);
    }

    /**
     * Advance through multiple lifecycle states sequentially.
     * Skips states already reached, stops at terminal states.
     *
     * @param  list<LifecycleStatus>  $targets
     */
    private function advanceThrough(Operation $operation, array $targets): void
    {
        foreach ($targets as $target) {
            $operation->refresh();

            if ($operation->lifecycle_status === $target) {
                continue;
            }

            if ($operation->lifecycle_status->isTerminal()) {
                break;
            }

            if (! $this->transitionService->canTransition($operation, 'lifecycle', $target)) {
                break;
            }

            $this->transitionService->applyTransition(
                $operation,
                'lifecycle',
                $target,
                reason: 'self-service auto-advance',
            );
        }
    }

    /**
     * Campaign scheduled: advance DRAFT -> PREPARING -> READY -> SCHEDULED.
     */
    private function advanceToScheduled(Operation $operation): void
    {
        $this->advanceThrough($operation, [
            LifecycleStatus::PREPARING,
            LifecycleStatus::READY,
            LifecycleStatus::SCHEDULED,
        ]);

        $this->markAsPrepaid($operation);
    }

    /**
     * Campaign sending: advance through to PROCESSING.
     */
    private function advanceOnSend(Operation $operation): void
    {
        $this->advanceThrough($operation, [
            LifecycleStatus::PREPARING,
            LifecycleStatus::READY,
            LifecycleStatus::SCHEDULED,
            LifecycleStatus::PROCESSING,
        ]);

        $this->markAsPrepaid($operation);
    }

    /**
     * Campaign sent: advance through to DELIVERED.
     * STOP at DELIVERED -- COMPLETED is handled by a separate job (Step 5) after 72h.
     */
    private function advanceOnComplete(Operation $operation): void
    {
        $this->advanceThrough($operation, [
            LifecycleStatus::PREPARING,
            LifecycleStatus::READY,
            LifecycleStatus::SCHEDULED,
            LifecycleStatus::PROCESSING,
            LifecycleStatus::DELIVERED,
        ]);

        $operation->refresh();
        if ($operation->lifecycle_status === LifecycleStatus::DELIVERED && $operation->delivered_at === null) {
            $operation->update(['delivered_at' => now()]);
        }

        $this->markAsPrepaid($operation);
    }

    /**
     * Campaign cancelled: transition to CANCELLED with client_request type.
     */
    private function advanceOnCancel(Operation $operation): void
    {
        $operation->refresh();

        if ($operation->lifecycle_status->isTerminal()) {
            return;
        }

        if ($this->transitionService->canTransition($operation, 'lifecycle', LifecycleStatus::CANCELLED)) {
            $this->transitionService->applyTransition(
                $operation,
                'lifecycle',
                LifecycleStatus::CANCELLED,
                reason: 'self-service cancellation',
                metadata: ['cancellation_type' => CancellationType::CLIENT_REQUEST->value],
            );
        }
    }

    /**
     * Campaign failed: transition to CANCELLED with technical_error type.
     */
    private function advanceOnFail(Operation $operation): void
    {
        $operation->refresh();

        if ($operation->lifecycle_status->isTerminal()) {
            return;
        }

        if ($this->transitionService->canTransition($operation, 'lifecycle', LifecycleStatus::CANCELLED)) {
            $this->transitionService->applyTransition(
                $operation,
                'lifecycle',
                LifecycleStatus::CANCELLED,
                reason: 'self-service send failure',
                metadata: ['cancellation_type' => CancellationType::TECHNICAL_ERROR->value],
            );
        }
    }

    /**
     * Data ops follow a simplified path: DRAFT -> PREPARING -> PROCESSING -> DELIVERED.
     */
    private function handleDataOpStatusChange(Campaign $campaign, Operation $operation): void
    {
        match ($campaign->status) {
            CampaignStatus::SENDING => $this->advanceThrough($operation, [
                LifecycleStatus::PREPARING,
                LifecycleStatus::READY,
                LifecycleStatus::SCHEDULED,
                LifecycleStatus::PROCESSING,
            ]),
            CampaignStatus::SENT => $this->advanceThrough($operation, [
                LifecycleStatus::PREPARING,
                LifecycleStatus::READY,
                LifecycleStatus::SCHEDULED,
                LifecycleStatus::PROCESSING,
                LifecycleStatus::DELIVERED,
            ]),
            CampaignStatus::CANCELLED => $this->advanceOnCancel($operation),
            CampaignStatus::FAILED => $this->advanceOnFail($operation),
            default => null,
        };
    }

    /**
     * Mark billing as prepaid for self-service operations.
     */
    private function markAsPrepaid(Operation $operation): void
    {
        $operation->refresh();

        if ($operation->billing_status === BillingStatus::PENDING) {
            $operation->update(['billing_status' => BillingStatus::PREPAID]);
        }
    }

    private function mapCampaignTypeToOperationType(CampaignType $type): OperationType
    {
        return match ($type) {
            CampaignType::PROSPECTION => OperationType::LOC,
            CampaignType::FIDELISATION => OperationType::FID,
            CampaignType::COMPTAGE => OperationType::LOC,
        };
    }

    /**
     * Find or create a Demande for a partner (same day grouping with lock).
     */
    private function findOrCreateDemande(int $partnerId): Demande
    {
        return DB::transaction(function () use ($partnerId): Demande {
            $today = now()->toDateString();

            /** @var Demande|null $existing */
            $existing = Demande::where('partner_id', $partnerId)
                ->whereDate('created_at', $today)
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            return Demande::create([
                'partner_id' => $partnerId,
                'information' => 'Auto-created from self-service campaign',
                'pays_id' => 'FR',
            ]);
        });
    }
}

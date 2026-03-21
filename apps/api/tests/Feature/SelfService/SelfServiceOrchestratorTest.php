<?php

declare(strict_types=1);

use App\Enums\BillingStatus;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Enums\CancellationType;
use App\Enums\LifecycleStatus;
use App\Enums\OperationType;
use App\Models\Campaign;
use App\Models\Demande;
use App\Models\Operation;
use App\Models\Partner;
use App\Services\SelfServiceOrchestrator;

/**
 * Helper: create a campaign without triggering the observer (so we can test the orchestrator in isolation).
 *
 * @param array<string, mixed> $attributes
 */
function createCampaignWithoutEvents(array $attributes = []): Campaign
{
    $campaign = null;
    Campaign::withoutEvents(function () use (&$campaign, $attributes): void {
        $campaign = Campaign::factory()->create($attributes);
    });

    return $campaign;
}

// --- createFromCampaign ---

it('creates Demande and Operation from a new campaign', function (): void {
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $operation = $orchestrator->createFromCampaign($campaign);

    expect($operation)->not->toBeNull();
    expect($operation->type)->toBe(OperationType::LOC);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::DRAFT);
    expect($operation->demande)->not->toBeNull();
    expect($operation->demande->partner_id)->toBe($campaign->partner_id);

    $campaign->refresh();
    expect($campaign->operation_id)->toBe($operation->id);
});

it('maps prospection to LOC', function (): void {
    $campaign = createCampaignWithoutEvents(['type' => CampaignType::PROSPECTION]);

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $operation = $orchestrator->createFromCampaign($campaign);

    expect($operation->type)->toBe(OperationType::LOC);
});

it('maps fidelisation to FID', function (): void {
    $campaign = createCampaignWithoutEvents(['type' => CampaignType::FIDELISATION]);

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $operation = $orchestrator->createFromCampaign($campaign);

    expect($operation->type)->toBe(OperationType::FID);
});

it('maps comptage to LOC', function (): void {
    $campaign = createCampaignWithoutEvents(['type' => CampaignType::COMPTAGE]);

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $operation = $orchestrator->createFromCampaign($campaign);

    expect($operation->type)->toBe(OperationType::LOC);
});

it('skips demo campaigns', function (): void {
    $campaign = createCampaignWithoutEvents(['is_demo' => true]);

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $operation = $orchestrator->createFromCampaign($campaign);

    expect($operation)->toBeNull();
});

it('reuses an open Demande for the same partner on the same day', function (): void {
    $partner = Partner::factory()->create();
    $campaign1 = createCampaignWithoutEvents(['partner_id' => $partner->id]);
    $campaign2 = createCampaignWithoutEvents(['partner_id' => $partner->id]);

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $op1 = $orchestrator->createFromCampaign($campaign1);
    $op2 = $orchestrator->createFromCampaign($campaign2);

    expect($op1->demande_id)->toBe($op2->demande_id);
    expect($op1->id)->not->toBe($op2->id);
});

it('is idempotent - returns null if already linked', function (): void {
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $first = $orchestrator->createFromCampaign($campaign);
    expect($first)->not->toBeNull();

    $campaign->refresh();
    $second = $orchestrator->createFromCampaign($campaign);
    expect($second)->toBeNull();

    // Only one operation exists for this campaign
    expect(Operation::where('id', $first->id)->count())->toBe(1);
});

// Note: partner_id is NOT NULL in the DB schema, so the guard for null partner_id
// in the orchestrator is purely defensive. No test needed since the DB prevents it.

// --- syncOperationFromCampaign ---

it('syncs data on campaign update with dirty check', function (): void {
    $campaign = createCampaignWithoutEvents([
        'message' => 'Hello',
        'volume_estimated' => 100,
    ]);

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $operation = $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    // Update campaign data
    Campaign::withoutEvents(function () use ($campaign): void {
        $campaign->update([
            'message' => 'Updated message',
            'volume_estimated' => 500,
        ]);
    });

    $orchestrator->syncOperationFromCampaign($campaign);

    $operation->refresh();
    expect($operation->message)->toBe('Updated message');
    expect($operation->volume_estimated)->toBe(500);
});

it('skips sync when no values changed', function (): void {
    $campaign = createCampaignWithoutEvents(['message' => 'Same']);

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    // Call sync without changes - should not throw or update
    $orchestrator->syncOperationFromCampaign($campaign);

    $operation = Operation::find($campaign->operation_id);
    expect($operation->message)->toBe('Same');
});

it('does not sync a terminal operation', function (): void {
    $campaign = createCampaignWithoutEvents(['message' => 'Before']);

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $operation = $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    // Force operation to terminal state
    $operation->update(['lifecycle_status' => LifecycleStatus::COMPLETED]);

    Campaign::withoutEvents(function () use ($campaign): void {
        $campaign->update(['message' => 'After']);
    });

    $orchestrator->syncOperationFromCampaign($campaign);

    $operation->refresh();
    expect($operation->message)->toBe('Before');
});

// --- handleStatusChange ---

it('advances to scheduled on scheduled status', function (): void {
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    Campaign::withoutEvents(function () use ($campaign): void {
        $campaign->update(['status' => CampaignStatus::SCHEDULED, 'scheduled_at' => now()->addDay()]);
    });

    $orchestrator->handleStatusChange($campaign);

    $operation = Operation::find($campaign->operation_id);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::SCHEDULED);
    expect($operation->billing_status)->toBe(BillingStatus::PREPAID);
});

it('advances to processing on sending status', function (): void {
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    Campaign::withoutEvents(function () use ($campaign): void {
        $campaign->update(['status' => CampaignStatus::SENDING]);
    });

    $orchestrator->handleStatusChange($campaign);

    $operation = Operation::find($campaign->operation_id);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::PROCESSING);
    expect($operation->billing_status)->toBe(BillingStatus::PREPAID);
});

it('advances to delivered on sent status and sets delivered_at', function (): void {
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    Campaign::withoutEvents(function () use ($campaign): void {
        $campaign->update(['status' => CampaignStatus::SENT, 'sent_at' => now()]);
    });

    $orchestrator->handleStatusChange($campaign);

    $operation = Operation::find($campaign->operation_id);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::DELIVERED);
    expect($operation->delivered_at)->not->toBeNull();
    // NOT completed - that is a separate step
    expect($operation->lifecycle_status)->not->toBe(LifecycleStatus::COMPLETED);
});

it('cancels on cancel status', function (): void {
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    Campaign::withoutEvents(function () use ($campaign): void {
        $campaign->update(['status' => CampaignStatus::CANCELLED]);
    });

    $orchestrator->handleStatusChange($campaign);

    $operation = Operation::find($campaign->operation_id);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::CANCELLED);
    expect($operation->cancellation_type)->toBe(CancellationType::CLIENT_REQUEST);
});

it('cancels with technical_error on failed status', function (): void {
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    Campaign::withoutEvents(function () use ($campaign): void {
        $campaign->update(['status' => CampaignStatus::FAILED, 'error_message' => 'Router error']);
    });

    $orchestrator->handleStatusChange($campaign);

    $operation = Operation::find($campaign->operation_id);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::CANCELLED);
    expect($operation->cancellation_type)->toBe(CancellationType::TECHNICAL_ERROR);
});

it('does not cancel an already terminal operation', function (): void {
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $operation = $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    // Force to completed
    $operation->update(['lifecycle_status' => LifecycleStatus::COMPLETED]);

    Campaign::withoutEvents(function () use ($campaign): void {
        $campaign->update(['status' => CampaignStatus::CANCELLED]);
    });

    $orchestrator->handleStatusChange($campaign);

    $operation->refresh();
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::COMPLETED);
});

it('handles data op simplified path on sent', function (): void {
    // Create an ENRICH-type operation directly, not via campaign type mapping
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $operation = $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    // Change operation to a data op type directly in the DB
    // We need to avoid initializeTrackStatuses resetting billing
    Operation::withoutEvents(function () use ($operation): void {
        $operation->forceFill(['type' => OperationType::ENRICH->value])->save();
    });

    Campaign::withoutEvents(function () use ($campaign): void {
        $campaign->update(['status' => CampaignStatus::SENT]);
    });

    $orchestrator->handleStatusChange($campaign);

    $operation->refresh();
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::DELIVERED);
});

// --- handleCampaignDeleted ---

it('cancels operation when campaign is deleted', function (): void {
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    $orchestrator->handleCampaignDeleted($campaign);

    $operation = Operation::find($campaign->operation_id);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::CANCELLED);
});

it('does not cancel terminal operation on campaign delete', function (): void {
    $campaign = createCampaignWithoutEvents();

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);
    $operation = $orchestrator->createFromCampaign($campaign);
    $campaign->refresh();

    $operation->update(['lifecycle_status' => LifecycleStatus::COMPLETED]);

    $orchestrator->handleCampaignDeleted($campaign);

    $operation->refresh();
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::COMPLETED);
});

it('does nothing when campaign has no operation_id on status change', function (): void {
    $campaign = createCampaignWithoutEvents(['is_demo' => true]);

    /** @var SelfServiceOrchestrator $orchestrator */
    $orchestrator = app(SelfServiceOrchestrator::class);

    // Should not throw
    $orchestrator->handleStatusChange($campaign);
    $orchestrator->syncOperationFromCampaign($campaign);
    $orchestrator->handleCampaignDeleted($campaign);

    expect(true)->toBeTrue();
});

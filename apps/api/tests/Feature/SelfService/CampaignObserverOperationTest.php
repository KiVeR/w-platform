<?php

declare(strict_types=1);

use App\Enums\CampaignStatus;
use App\Enums\CancellationType;
use App\Enums\LifecycleStatus;
use App\Enums\OperationType;
use App\Models\Campaign;
use App\Models\Operation;
use App\Models\Partner;

// --- Observer auto-creation ---

it('auto-creates operation when campaign is created via observer', function (): void {
    $campaign = Campaign::factory()->prospection()->create();

    $campaign->refresh();
    expect($campaign->operation_id)->not->toBeNull();

    $operation = Operation::find($campaign->operation_id);
    expect($operation)->not->toBeNull();
    expect($operation->type)->toBe(OperationType::LOC);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::DRAFT);
});

it('does not auto-create operation for demo campaign via observer', function (): void {
    $campaign = Campaign::factory()->demo()->create();

    $campaign->refresh();
    expect($campaign->operation_id)->toBeNull();
    expect(Operation::count())->toBe(0);
});

// Note: partner_id is NOT NULL in the DB schema, so the guard for null partner_id
// in the orchestrator is purely defensive. No test needed since the DB prevents it.

// --- Observer status transitions ---

it('transitions operation when campaign status changes to scheduled', function (): void {
    $campaign = Campaign::factory()->create();
    $campaign->refresh();
    $operationId = $campaign->operation_id;

    $campaign->update(['status' => CampaignStatus::SCHEDULED, 'scheduled_at' => now()->addDay()]);

    $operation = Operation::find($operationId);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::SCHEDULED);
});

it('transitions operation when campaign status changes to sent', function (): void {
    $campaign = Campaign::factory()->create();
    $campaign->refresh();
    $operationId = $campaign->operation_id;

    $campaign->update(['status' => CampaignStatus::SENT, 'sent_at' => now()]);

    $operation = Operation::find($operationId);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::DELIVERED);
    expect($operation->delivered_at)->not->toBeNull();
});

it('cancels operation when campaign is soft-deleted', function (): void {
    $campaign = Campaign::factory()->create();
    $campaign->refresh();
    $operationId = $campaign->operation_id;

    $campaign->delete();

    $operation = Operation::find($operationId);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::CANCELLED);
    expect($operation->cancellation_type)->toBe(CancellationType::CLIENT_REQUEST);
});

it('does not cancel terminal operation on campaign soft-delete', function (): void {
    $campaign = Campaign::factory()->create();
    $campaign->refresh();
    $operationId = $campaign->operation_id;

    $operation = Operation::find($operationId);
    $operation->update(['lifecycle_status' => LifecycleStatus::COMPLETED]);

    $campaign->delete();

    $operation->refresh();
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::COMPLETED);
});

// --- Observer data sync ---

it('syncs data when campaign targeting is updated', function (): void {
    $campaign = Campaign::factory()->create([
        'targeting' => ['zones' => [['code' => '75', 'volume' => 100]]],
        'message' => 'Original',
    ]);
    $campaign->refresh();
    $operationId = $campaign->operation_id;

    $newTargeting = ['zones' => [['code' => '77', 'volume' => 500]]];
    $campaign->update([
        'targeting' => $newTargeting,
        'message' => 'Updated',
    ]);

    $operation = Operation::find($operationId);
    expect($operation->targeting)->toBe($newTargeting);
    expect($operation->message)->toBe('Updated');
});

// --- Idempotence ---

it('does not create duplicate operations on multiple saves', function (): void {
    $campaign = Campaign::factory()->create();
    $campaign->refresh();
    $operationId = $campaign->operation_id;

    // Save again without meaningful changes
    $campaign->update(['name' => 'Renamed campaign']);
    $campaign->refresh();

    expect($campaign->operation_id)->toBe($operationId);
    expect(Operation::count())->toBe(1);
});

// --- Fidelisation type ---

it('creates FID operation for fidelisation campaign', function (): void {
    $campaign = Campaign::factory()->fidelisation()->create();
    $campaign->refresh();

    $operation = Operation::find($campaign->operation_id);
    expect($operation->type)->toBe(OperationType::FID);
});

// --- Existing events still dispatched ---

it('still dispatches CampaignCreated event on create', function (): void {
    Event::fake([\App\Events\CampaignCreated::class]);

    Campaign::factory()->create();

    Event::assertDispatched(\App\Events\CampaignCreated::class);
});

it('still dispatches CampaignUpdated event on update', function (): void {
    // Create without event fake so operation gets created
    $campaign = Campaign::factory()->create();

    Event::fake([\App\Events\CampaignUpdated::class]);

    $campaign->update(['name' => 'New name']);

    Event::assertDispatched(\App\Events\CampaignUpdated::class);
});

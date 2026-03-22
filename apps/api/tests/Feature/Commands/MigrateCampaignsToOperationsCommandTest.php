<?php

declare(strict_types=1);

use App\Enums\BillingStatus;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Enums\LifecycleStatus;
use App\Enums\OperationType;
use App\Models\Campaign;
use App\Models\Demande;
use App\Models\Operation;
use App\Models\Partner;

/**
 * Helper: create a campaign that has no operation_id yet.
 * We bypass the CampaignObserver (which would auto-create an Operation via SelfServiceOrchestrator).
 *
 * @param  array<string, mixed>  $attributes
 */
function makeUnlinkedCampaign(array $attributes = []): Campaign
{
    return Campaign::withoutEvents(fn () => Campaign::factory()->create($attributes));
}

it('migrates a prospection campaign to a LOC operation', function (): void {
    $campaign = makeUnlinkedCampaign();

    $this->artisan('campaigns:migrate-to-operations')
        ->assertSuccessful();

    $campaign->refresh();
    expect($campaign->operation_id)->not->toBeNull();

    $operation = Operation::find($campaign->operation_id);
    expect($operation)->not->toBeNull();
    expect($operation->type)->toBe(OperationType::LOC);
    expect($operation->name)->toBe($campaign->name);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::DRAFT);
});

it('migrates a fidelisation campaign to a FID operation', function (): void {
    $campaign = makeUnlinkedCampaign(['type' => CampaignType::FIDELISATION]);

    $this->artisan('campaigns:migrate-to-operations')
        ->assertSuccessful();

    $campaign->refresh();
    $operation = Operation::find($campaign->operation_id);
    expect($operation->type)->toBe(OperationType::FID);
});

it('is idempotent — second run creates no duplicates', function (): void {
    $campaign = makeUnlinkedCampaign();

    $this->artisan('campaigns:migrate-to-operations')->assertSuccessful();
    $campaign->refresh();
    $firstOperationId = $campaign->operation_id;

    $this->artisan('campaigns:migrate-to-operations')->assertSuccessful();
    $campaign->refresh();

    expect($campaign->operation_id)->toBe($firstOperationId);
    expect(Operation::count())->toBe(1);
});

it('dry-run does not write to database', function (): void {
    $campaign = makeUnlinkedCampaign();

    $this->artisan('campaigns:migrate-to-operations', ['--dry-run' => true])
        ->expectsOutputToContain('DRY RUN')
        ->expectsOutputToContain("[DRY] Would migrate campaign #{$campaign->id}")
        ->assertSuccessful();

    $campaign->refresh();
    expect($campaign->operation_id)->toBeNull();
    expect(Operation::count())->toBe(0);
    expect(Demande::count())->toBe(0);
});

it('excludes comptage campaigns', function (): void {
    $comptage = makeUnlinkedCampaign(['type' => CampaignType::COMPTAGE]);
    $prospection = makeUnlinkedCampaign(['type' => CampaignType::PROSPECTION]);

    $this->artisan('campaigns:migrate-to-operations')
        ->expectsOutputToContain('Skipping 1 comptage')
        ->assertSuccessful();

    $comptage->refresh();
    expect($comptage->operation_id)->toBeNull();

    $prospection->refresh();
    expect($prospection->operation_id)->not->toBeNull();
});

it('maps sent status to delivered lifecycle status', function (): void {
    $campaign = makeUnlinkedCampaign(['status' => CampaignStatus::SENT, 'sent_at' => now()]);

    $this->artisan('campaigns:migrate-to-operations')->assertSuccessful();

    $campaign->refresh();
    $operation = Operation::find($campaign->operation_id);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::DELIVERED);
});

it('sets billing_status to prepaid when campaign was sent', function (): void {
    $campaign = makeUnlinkedCampaign(['status' => CampaignStatus::SENT, 'sent_at' => now()]);

    $this->artisan('campaigns:migrate-to-operations')->assertSuccessful();

    $campaign->refresh();
    $operation = Operation::find($campaign->operation_id);
    expect($operation->billing_status)->toBe(BillingStatus::PREPAID);
});

it('maps failed status to cancelled lifecycle status', function (): void {
    $campaign = makeUnlinkedCampaign(['status' => CampaignStatus::FAILED]);

    $this->artisan('campaigns:migrate-to-operations')->assertSuccessful();

    $campaign->refresh();
    $operation = Operation::find($campaign->operation_id);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::CANCELLED);
});

it('groups multiple campaigns for same partner into one Demande', function (): void {
    $partner = Partner::factory()->create();

    makeUnlinkedCampaign(['partner_id' => $partner->id]);
    makeUnlinkedCampaign(['partner_id' => $partner->id]);
    makeUnlinkedCampaign(['partner_id' => $partner->id]);

    $this->artisan('campaigns:migrate-to-operations')->assertSuccessful();

    expect(Demande::where('partner_id', $partner->id)->count())->toBe(1);
    expect(Operation::count())->toBe(3);
});

it('--campaign option migrates a single campaign by ID', function (): void {
    $campaign1 = makeUnlinkedCampaign();
    $campaign2 = makeUnlinkedCampaign();

    $this->artisan('campaigns:migrate-to-operations', ['--campaign' => $campaign1->id])
        ->assertSuccessful();

    $campaign1->refresh();
    $campaign2->refresh();

    expect($campaign1->operation_id)->not->toBeNull();
    expect($campaign2->operation_id)->toBeNull();
});

it('--partner option filters campaigns by partner ID', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();

    $campaign1 = makeUnlinkedCampaign(['partner_id' => $partner1->id]);
    $campaign2 = makeUnlinkedCampaign(['partner_id' => $partner2->id]);

    $this->artisan('campaigns:migrate-to-operations', ['--partner' => $partner1->id])
        ->assertSuccessful();

    $campaign1->refresh();
    $campaign2->refresh();

    expect($campaign1->operation_id)->not->toBeNull();
    expect($campaign2->operation_id)->toBeNull();
});

it('maps scheduling statuses correctly', function (): void {
    $scheduled = makeUnlinkedCampaign(['status' => CampaignStatus::SCHEDULED, 'scheduled_at' => now()->addDay()]);
    $sending = makeUnlinkedCampaign(['status' => CampaignStatus::SENDING, 'scheduled_at' => now()]);
    $cancelled = makeUnlinkedCampaign(['status' => CampaignStatus::CANCELLED]);

    $this->artisan('campaigns:migrate-to-operations')->assertSuccessful();

    $scheduledOp = Operation::find($scheduled->refresh()->operation_id);
    $sendingOp = Operation::find($sending->refresh()->operation_id);
    $cancelledOp = Operation::find($cancelled->refresh()->operation_id);

    expect($scheduledOp->lifecycle_status)->toBe(LifecycleStatus::SCHEDULED);
    expect($sendingOp->lifecycle_status)->toBe(LifecycleStatus::PROCESSING);
    expect($cancelledOp->lifecycle_status)->toBe(LifecycleStatus::CANCELLED);
});

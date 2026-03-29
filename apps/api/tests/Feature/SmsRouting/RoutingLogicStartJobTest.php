<?php

declare(strict_types=1);

use App\Enums\CampaignRecipientStatus;
use App\Enums\CampaignRoutingStatus;
use App\Jobs\SmsRouting\RoutingLogicSendJob;
use App\Jobs\SmsRouting\RoutingLogicStartJob;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Router;
use Illuminate\Support\Facades\Bus;

describe('RoutingLogicStartJob', function (): void {
    it('dispatches send jobs for each chunk of recipients', function (): void {
        Bus::fake([RoutingLogicSendJob::class]);
        config(['sms-routing.router_chunk_size' => 2]);

        $router = Router::factory()->sinch()->create();
        $campaign = Campaign::factory()->create([
            'router_id' => $router->id,
            'routing_status' => CampaignRoutingStatus::RoutingPending,
        ]);

        CampaignRecipient::factory()->count(5)->create([
            'campaign_id' => $campaign->id,
            'status' => CampaignRecipientStatus::Queued,
        ]);

        $job = new RoutingLogicStartJob($campaign->id);
        $job->handle();

        expect($campaign->refresh()->routing_status)->toBe(CampaignRoutingStatus::RoutingInProgress);
    });

    it('skips when routing status is not pending', function (): void {
        Bus::fake([RoutingLogicSendJob::class]);

        $router = Router::factory()->sinch()->create();
        $campaign = Campaign::factory()->create([
            'router_id' => $router->id,
            'routing_status' => CampaignRoutingStatus::RoutingInProgress,
        ]);

        CampaignRecipient::factory()->count(3)->create([
            'campaign_id' => $campaign->id,
            'status' => CampaignRecipientStatus::Queued,
        ]);

        $job = new RoutingLogicStartJob($campaign->id);
        $job->handle();

        // Status should remain unchanged
        expect($campaign->refresh()->routing_status)->toBe(CampaignRoutingStatus::RoutingInProgress);
        Bus::assertNotDispatched(RoutingLogicSendJob::class);
    });

    it('skips when campaign has no recipients', function (): void {
        Bus::fake([RoutingLogicSendJob::class]);

        $router = Router::factory()->sinch()->create();
        $campaign = Campaign::factory()->create([
            'router_id' => $router->id,
            'routing_status' => CampaignRoutingStatus::RoutingPending,
        ]);

        $job = new RoutingLogicStartJob($campaign->id);
        $job->handle();

        expect($campaign->refresh()->routing_status)->toBe(CampaignRoutingStatus::RoutingPending);
        Bus::assertNotDispatched(RoutingLogicSendJob::class);
    });

    it('skips when all recipients are already dispatched', function (): void {
        Bus::fake([RoutingLogicSendJob::class]);

        $router = Router::factory()->sinch()->create();
        $campaign = Campaign::factory()->create([
            'router_id' => $router->id,
            'routing_status' => CampaignRoutingStatus::RoutingPending,
        ]);

        CampaignRecipient::factory()->count(3)->dispatched()->create([
            'campaign_id' => $campaign->id,
        ]);

        $job = new RoutingLogicStartJob($campaign->id);
        $job->handle();

        // No queued recipients, so no jobs dispatched; status remains pending
        expect($campaign->refresh()->routing_status)->toBe(CampaignRoutingStatus::RoutingPending);
    });

    it('has correct uniqueId based on campaign id', function (): void {
        $job = new RoutingLogicStartJob(42);

        expect($job->uniqueId())->toBe(42);
    });

    it('uses high queue', function (): void {
        $job = new RoutingLogicStartJob(1);

        expect($job->queue)->toBe('high');
    });
});

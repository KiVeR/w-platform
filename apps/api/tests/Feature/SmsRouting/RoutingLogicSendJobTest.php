<?php

declare(strict_types=1);

use App\Enums\CampaignRecipientStatus;
use App\Enums\CampaignRoutingStatus;
use App\Jobs\SmsRouting\RoutingLogicSendJob;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Router;
use App\Services\SmsRouting\SmsRoutingManager;
use Illuminate\Support\Str;

describe('RoutingLogicSendJob', function (): void {
    it('sends sms and updates recipient status to dispatched', function (): void {
        $router = Router::factory()->sinch()->create();
        $campaign = Campaign::factory()->create([
            'router_id' => $router->id,
            'routing_status' => CampaignRoutingStatus::RoutingInProgress,
            'message' => 'Hello test',
            'sender' => 'Wellpack',
        ]);

        $recipients = CampaignRecipient::factory()->count(3)->create([
            'campaign_id' => $campaign->id,
            'status' => CampaignRecipientStatus::Queued,
        ]);

        $batchUuid = Str::uuid()->toString();
        $recipientIds = $recipients->pluck('id')->all();

        // Mock the SmsRoutingManager and its driver
        $mockDriver = Mockery::mock();
        $mockDriver->shouldReceive('batchUuid')->with($batchUuid)->andReturnSelf();
        $mockDriver->shouldReceive('to')->andReturnSelf();
        $mockDriver->shouldReceive('from')->with('Wellpack')->andReturnSelf();
        $mockDriver->shouldReceive('message')->andReturnSelf();
        $mockDriver->shouldReceive('send')->once();

        $manager = Mockery::mock(SmsRoutingManager::class);
        $manager->shouldReceive('driver')->with('sinch')->andReturn($mockDriver);

        $job = new RoutingLogicSendJob(
            campaignId: $campaign->id,
            recipientIds: $recipientIds,
            batchUuid: $batchUuid,
        );
        $job->handle($manager);

        // Verify all recipients are now dispatched
        foreach ($recipients as $recipient) {
            expect($recipient->refresh()->status)->toBe(CampaignRecipientStatus::Dispatched);
            expect($recipient->routing_batch_uuid)->toBe($batchUuid);
        }
    });

    it('skips when campaign routing status is not in progress', function (): void {
        $router = Router::factory()->sinch()->create();
        $campaign = Campaign::factory()->create([
            'router_id' => $router->id,
            'routing_status' => CampaignRoutingStatus::RoutingCompleted,
            'message' => 'Hello test',
        ]);

        $recipients = CampaignRecipient::factory()->count(2)->create([
            'campaign_id' => $campaign->id,
            'status' => CampaignRecipientStatus::Queued,
        ]);

        $batchUuid = Str::uuid()->toString();

        $manager = Mockery::mock(SmsRoutingManager::class);
        $manager->shouldNotReceive('driver');

        $job = new RoutingLogicSendJob(
            campaignId: $campaign->id,
            recipientIds: $recipients->pluck('id')->all(),
            batchUuid: $batchUuid,
        );
        $job->handle($manager);

        // Recipients should remain queued
        foreach ($recipients as $recipient) {
            expect($recipient->refresh()->status)->toBe(CampaignRecipientStatus::Queued);
        }
    });

    it('skips when recipients are empty', function (): void {
        $router = Router::factory()->sinch()->create();
        $campaign = Campaign::factory()->create([
            'router_id' => $router->id,
            'routing_status' => CampaignRoutingStatus::RoutingInProgress,
            'message' => 'Hello test',
        ]);

        $batchUuid = Str::uuid()->toString();

        $manager = Mockery::mock(SmsRoutingManager::class);
        $manager->shouldNotReceive('driver');

        $job = new RoutingLogicSendJob(
            campaignId: $campaign->id,
            recipientIds: [999999], // non-existent IDs
            batchUuid: $batchUuid,
        );
        $job->handle($manager);
    });

    it('has correct uniqueId based on batch uuid', function (): void {
        $uuid = 'test-batch-uuid';
        $job = new RoutingLogicSendJob(
            campaignId: 1,
            recipientIds: [1, 2],
            batchUuid: $uuid,
        );

        expect($job->uniqueId())->toBe($uuid);
    });

    it('uses high queue', function (): void {
        $job = new RoutingLogicSendJob(
            campaignId: 1,
            recipientIds: [1],
            batchUuid: 'uuid',
        );

        expect($job->queue)->toBe('high');
    });
});

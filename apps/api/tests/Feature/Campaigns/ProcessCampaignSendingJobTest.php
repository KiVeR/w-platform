<?php

declare(strict_types=1);

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Enums\CampaignStatus;
use App\Jobs\ProcessCampaignSendingJob;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('marks campaign as sent on success', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENDING,
        'message' => 'Test',
        'sender' => 'BRAND',
        'volume_estimated' => 500,
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: true, externalId: 'wepak-12345'));

    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $job = new ProcessCampaignSendingJob($campaign);
    $job->handle($mockSender);

    $campaign->refresh();
    expect($campaign->status)->toBe(CampaignStatus::SENT)
        ->and($campaign->external_id)->toBe('wepak-12345')
        ->and($campaign->sent_at)->not->toBeNull();
});

it('marks campaign as failed on error', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENDING,
        'message' => 'Test',
        'sender' => 'BRAND',
        'volume_estimated' => 500,
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: false, error: 'Wepak timeout'));

    $job = new ProcessCampaignSendingJob($campaign);
    $job->handle($mockSender);

    $campaign->refresh();
    expect($campaign->status)->toBe(CampaignStatus::FAILED)
        ->and($campaign->error_message)->toBe('Wepak timeout')
        ->and($campaign->sent_at)->toBeNull();
});

it('uses campaigns queue', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create();

    $job = new ProcessCampaignSendingJob($campaign);

    expect($job->queue)->toBe('campaigns');
});

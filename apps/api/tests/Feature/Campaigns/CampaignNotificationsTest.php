<?php

declare(strict_types=1);

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Enums\CampaignStatus;
use App\Jobs\ProcessCampaignSendingJob;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use App\Notifications\CampaignFailedNotification;
use App\Notifications\CampaignSentNotification;
use App\Notifications\CampaignStatsAvailableNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    Notification::fake();
});

it('notifies creator on campaign sent', function (): void {
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
        ->andReturn(new SendResult(success: true, externalId: 'ext-123'));

    $job = new ProcessCampaignSendingJob($campaign);
    $job->handle($mockSender);

    Notification::assertSentTo($user, CampaignSentNotification::class);
});

it('notifies admins on campaign failure', function (): void {
    config(['campaign-sending.notifications.failure_emails' => 'admin@test.com,ops@test.com']);

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
        ->andReturn(new SendResult(success: false, error: 'Timeout'));

    $job = new ProcessCampaignSendingJob($campaign);
    $job->handle($mockSender);

    Notification::assertSentOnDemand(CampaignFailedNotification::class);
});

it('does not notify on failure if no emails configured', function (): void {
    config(['campaign-sending.notifications.failure_emails' => '']);

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
        ->andReturn(new SendResult(success: false, error: 'Timeout'));

    $job = new ProcessCampaignSendingJob($campaign);
    $job->handle($mockSender);

    Notification::assertNothingSentTo($user);
});

// Stats notification command tests

it('notifies stats available after 72h', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
        'stats_notified' => false,
    ]);

    $this->artisan('app:notify-campaign-stats')->assertSuccessful();

    Notification::assertSentTo($user, CampaignStatsAvailableNotification::class);
});

it('does not notify stats before 72h', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(71),
        'stats_notified' => false,
    ]);

    $this->artisan('app:notify-campaign-stats')->assertSuccessful();

    Notification::assertNothingSent();
});

it('does not notify stats twice', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
        'stats_notified' => true,
    ]);

    $this->artisan('app:notify-campaign-stats')->assertSuccessful();

    Notification::assertNothingSent();
});

it('marks campaign as stats_notified after notification', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
        'stats_notified' => false,
    ]);

    $this->artisan('app:notify-campaign-stats')->assertSuccessful();

    $campaign->refresh();
    expect($campaign->stats_notified)->toBeTrue();
});

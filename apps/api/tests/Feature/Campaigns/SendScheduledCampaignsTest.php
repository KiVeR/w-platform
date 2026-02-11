<?php

declare(strict_types=1);

use App\Enums\CampaignStatus;
use App\Jobs\ProcessCampaignSendingJob;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    Queue::fake();
});

it('dispatches jobs for scheduled campaigns', function (): void {
    Carbon::setTestNow(Carbon::create(2026, 2, 9, 10, 0, 0, 'Europe/Paris'));

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->scheduled(now()->subMinute())->create([
        'message' => 'Test',
        'sender' => 'BRAND',
    ]);

    $this->artisan('app:send-scheduled-campaigns')
        ->assertSuccessful();

    $campaign->refresh();
    expect($campaign->status)->toBe(CampaignStatus::SENDING);

    Queue::assertPushed(ProcessCampaignSendingJob::class, function ($job) use ($campaign) {
        return $job->campaign->id === $campaign->id;
    });
});

it('skips campaigns scheduled in the future', function (): void {
    Carbon::setTestNow(Carbon::create(2026, 2, 9, 10, 0, 0, 'Europe/Paris'));

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    Campaign::factory()->forPartner($partner)->forUser($user)->scheduled(now()->addHour())->create();

    $this->artisan('app:send-scheduled-campaigns')
        ->assertSuccessful();

    Queue::assertNothingPushed();
});

it('skips outside sending window', function (): void {
    Carbon::setTestNow(Carbon::create(2026, 2, 9, 6, 0, 0, 'Europe/Paris'));

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    Campaign::factory()->forPartner($partner)->forUser($user)->scheduled(now()->subMinute())->create();

    $this->artisan('app:send-scheduled-campaigns')
        ->assertSuccessful();

    Queue::assertNothingPushed();
});

it('skips campaigns not in scheduled status', function (): void {
    Carbon::setTestNow(Carbon::create(2026, 2, 9, 10, 0, 0, 'Europe/Paris'));

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::DRAFT,
        'scheduled_at' => now()->subMinute(),
    ]);

    Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'scheduled_at' => now()->subMinute(),
    ]);

    $this->artisan('app:send-scheduled-campaigns')
        ->assertSuccessful();

    Queue::assertNothingPushed();
});

it('dispatches multiple campaigns', function (): void {
    Carbon::setTestNow(Carbon::create(2026, 2, 9, 14, 0, 0, 'Europe/Paris'));

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    Campaign::factory()->forPartner($partner)->forUser($user)->count(3)->scheduled(now()->subMinute())->create();

    $this->artisan('app:send-scheduled-campaigns')
        ->assertSuccessful();

    Queue::assertPushed(ProcessCampaignSendingJob::class, 3);
});

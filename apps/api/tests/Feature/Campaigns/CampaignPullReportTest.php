<?php

declare(strict_types=1);

use App\Jobs\SmsRouting\PullReportsJob;
use App\Models\Campaign;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    Queue::fake([PullReportsJob::class]);
});

it('dispatches pull report for routed campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->withRouting()->create();

    $response = $this->postJson("/api/campaigns/{$campaign->id}/pull-report");

    $response->assertOk()
        ->assertJsonPath('message', 'Report pull requested.');

    Queue::assertPushed(PullReportsJob::class);
});

it('rejects pull report for campaign without routing_executed_at', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create();

    $response = $this->postJson("/api/campaigns/{$campaign->id}/pull-report");

    $response->assertStatus(422)
        ->assertJsonPath('message', 'Campaign has not been routed yet.');
});

it('rejects pull report for non-admin', function (): void {
    $user = User::factory()->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->withRouting()->create();

    $this->postJson("/api/campaigns/{$campaign->id}/pull-report")->assertForbidden();
});

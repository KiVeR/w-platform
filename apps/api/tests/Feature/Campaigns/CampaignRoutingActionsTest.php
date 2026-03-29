<?php

declare(strict_types=1);

use App\Enums\CampaignRoutingStatus;
use App\Jobs\SmsRouting\RoutingLogicStartJob;
use App\Models\Campaign;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    Queue::fake([RoutingLogicStartJob::class]);
});

// --- START ---

it('starts routing from ROUTING_PENDING', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingPending,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/routing/start");

    $response->assertOk()
        ->assertJsonPath('data.routing_status', 'ROUTING_PENDING');

    Queue::assertPushed(RoutingLogicStartJob::class);
});

it('resumes routing from ROUTING_PAUSED', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingPaused,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/routing/start");

    $response->assertOk();
    Queue::assertPushed(RoutingLogicStartJob::class);
});

it('rejects start from ROUTING_IN_PROGRESS', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingInProgress,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/routing/start");

    $response->assertStatus(409);
});

// --- PAUSE ---

it('pauses routing from ROUTING_IN_PROGRESS', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingInProgress,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/routing/pause");

    $response->assertOk()
        ->assertJsonPath('data.routing_status', 'ROUTING_PAUSED');
});

it('rejects pause from ROUTING_PENDING', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingPending,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/routing/pause");

    $response->assertStatus(409);
});

// --- CANCEL ---

it('cancels routing from any non-terminal state', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingInProgress,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/routing/cancel");

    $response->assertOk()
        ->assertJsonPath('data.routing_status', 'ROUTING_CANCELED');
});

it('rejects cancel from ROUTING_COMPLETED', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingCompleted,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/routing/cancel");

    $response->assertStatus(409);
});

// --- AUTH ---

it('rejects routing actions for non-admin users', function (): void {
    $user = User::factory()->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingPending,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/routing/start")->assertForbidden();
    $this->postJson("/api/campaigns/{$campaign->id}/routing/pause")->assertForbidden();
    $this->postJson("/api/campaigns/{$campaign->id}/routing/cancel")->assertForbidden();
});

it('rejects routing actions for campaign without routing_status', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create([
        'routing_status' => null,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/routing/start")->assertStatus(409);
});

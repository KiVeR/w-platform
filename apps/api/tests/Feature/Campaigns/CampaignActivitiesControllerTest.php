<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\LogActivity;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('lists campaign activities ordered by newest first', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create();
    $otherCampaign = Campaign::factory()->create();

    $older = LogActivity::factory()->create([
        'model_type' => Campaign::class,
        'model_id' => $campaign->id,
        'event' => 'created',
        'created_at' => now()->subMinute(),
    ]);

    $newer = LogActivity::factory()->create([
        'model_type' => Campaign::class,
        'model_id' => $campaign->id,
        'event' => 'updated',
        'created_at' => now(),
    ]);

    LogActivity::factory()->create([
        'model_type' => Campaign::class,
        'model_id' => $otherCampaign->id,
        'event' => 'deleted',
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/activities");

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $newer->id)
        ->assertJsonPath('data.0.event', 'updated')
        ->assertJsonPath('data.1.id', $older->id)
        ->assertJsonPath('data.1.event', 'created');
});

it('denies partner from listing another partner campaign activities', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($otherPartner)->create();

    $this->getJson("/api/campaigns/{$campaign->id}/activities")
        ->assertForbidden();
});

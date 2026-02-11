<?php

declare(strict_types=1);

use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('returns 200 with csv content type for sent campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'name' => 'Export Test',
        'volume_estimated' => 1000,
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/export");

    $response->assertOk()
        ->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
});

it('returns Content-Disposition header with filename', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'name' => 'Export Test',
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/export");

    $response->assertOk();
    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('attachment')
        ->and($disposition)->toContain('.csv');
});

it('returns 422 for draft campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create();

    $response = $this->getJson("/api/campaigns/{$campaign->id}/export");

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Only sent campaigns can be exported.');
});

it('allows admin to export any campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create();

    $this->getJson("/api/campaigns/{$campaign->id}/export")->assertOk();
});

it('allows same partner user to export', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create();

    $this->getJson("/api/campaigns/{$campaign->id}/export")->assertOk();
});

it('denies another partner from exporting', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner2)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now(),
    ]);

    $this->getJson("/api/campaigns/{$campaign->id}/export")->assertForbidden();
});

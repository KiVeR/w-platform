<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\LandingPage;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('creates campaign with landing_page_id', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();
    $lp = LandingPage::factory()->forPartner($partner)->create();

    $response = $this->postJson('/api/campaigns', [
        'name' => 'Campaign with LP',
        'type' => 'prospection',
        'channel' => 'sms',
        'partner_id' => $partner->id,
        'landing_page_id' => $lp->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.landing_page_id', $lp->id);
});

it('updates campaign landing_page_id', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($admin)->create();
    $lp = LandingPage::factory()->forPartner($partner)->create();

    $response = $this->putJson("/api/campaigns/{$campaign->id}", [
        'landing_page_id' => $lp->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.landing_page_id', $lp->id);
});

it('includes landingPage on campaign show', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();
    $lp = LandingPage::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($admin)->create([
        'landing_page_id' => $lp->id,
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}?include=landingPage");

    $response->assertOk()
        ->assertJsonPath('data.landing_page.id', $lp->id);
});

it('includes landingPage on campaign index', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();
    $lp = LandingPage::factory()->forPartner($partner)->create();
    Campaign::factory()->forPartner($partner)->forUser($admin)->create([
        'landing_page_id' => $lp->id,
    ]);

    $response = $this->getJson('/api/campaigns?include=landingPage');

    $response->assertOk()
        ->assertJsonPath('data.0.landing_page.id', $lp->id);
});

it('sets landing_page_id to null when landing page is deleted (nullOnDelete)', function (): void {
    $partner = Partner::factory()->create();
    $lp = LandingPage::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->create([
        'landing_page_id' => $lp->id,
    ]);

    // Force delete (not soft delete) to trigger nullOnDelete
    $lp->forceDelete();

    expect($campaign->fresh()->landing_page_id)->toBeNull();
});

it('validates landing_page_id exists', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/campaigns', [
        'name' => 'Campaign with bad LP',
        'type' => 'prospection',
        'channel' => 'sms',
        'partner_id' => $partner->id,
        'landing_page_id' => 99999,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['landing_page_id']);
});

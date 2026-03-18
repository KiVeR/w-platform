<?php

declare(strict_types=1);

use App\Enums\CampaignStatus;
use App\Enums\CampaignRoutingStatus;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Partner;
use App\Models\Router;
use App\Models\User;
use App\Models\VariableSchema;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- INDEX ---

it('allows admin to list all campaigns', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Campaign::factory()->count(3)->create();

    $response = $this->getJson('/api/campaigns');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('scopes campaigns to partner for non-admin', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    Campaign::factory()->count(2)->forPartner($partner1)->create();
    Campaign::factory()->count(3)->forPartner($partner2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/campaigns');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('denies employee from listing campaigns', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/campaigns')->assertForbidden();
});

it('returns 401 when unauthenticated for campaigns', function (): void {
    $this->getJson('/api/campaigns')->assertUnauthorized();
});

it('filters campaigns by type', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Campaign::factory()->prospection()->create();
    Campaign::factory()->fidelisation()->create();

    $response = $this->getJson('/api/campaigns?filter[type]=prospection');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'prospection');
});

it('filters campaigns by partial name', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Campaign::factory()->create(['name' => 'Promo Spring 2026']);
    Campaign::factory()->create(['name' => 'Newsletter Summer']);

    $response = $this->getJson('/api/campaigns?filter[name]=Promo');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Promo Spring 2026');
});

it('filters campaigns by multiple statuses', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Campaign::factory()->sent()->create(['name' => 'Sent Campaign']);
    Campaign::factory()->failed()->create(['name' => 'Failed Campaign']);
    Campaign::factory()->create(['name' => 'Draft Campaign']);

    $response = $this->getJson('/api/campaigns?filter[status][]=sent&filter[status][]=failed');

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment(['name' => 'Sent Campaign'])
        ->assertJsonFragment(['name' => 'Failed Campaign'])
        ->assertJsonMissing(['name' => 'Draft Campaign']);
});

it('filters campaigns by created_at_from date', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Campaign::factory()->create([
        'name' => 'Old Campaign',
        'created_at' => now()->subDays(12),
    ]);
    Campaign::factory()->create([
        'name' => 'Recent Campaign',
        'created_at' => now()->subDays(3),
    ]);

    $response = $this->getJson('/api/campaigns?filter[created_at_from]='.now()->subDays(7)->toDateString());

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Recent Campaign');
});

it('filters campaigns by created_at_to date', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Campaign::factory()->create([
        'name' => 'Older Campaign',
        'created_at' => now()->subDays(10),
    ]);
    Campaign::factory()->create([
        'name' => 'Newest Campaign',
        'created_at' => now()->subDays(1),
    ]);

    $response = $this->getJson('/api/campaigns?filter[created_at_to]='.now()->subDays(7)->toDateString());

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Older Campaign');
});

it('combines partner scope with name, status, and date filters', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();

    Campaign::factory()->forPartner($partner1)->sent()->create([
        'name' => 'Promo Partner One',
        'created_at' => now()->subDays(4),
    ]);
    Campaign::factory()->forPartner($partner1)->failed()->create([
        'name' => 'Promo Failed Partner One',
        'created_at' => now()->subDays(3),
    ]);
    Campaign::factory()->forPartner($partner2)->sent()->create([
        'name' => 'Promo Partner Two',
        'created_at' => now()->subDays(4),
    ]);

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson(sprintf(
        '/api/campaigns?filter[name]=Promo&filter[status][]=sent&filter[created_at_from]=%s&filter[created_at_to]=%s',
        now()->subDays(5)->toDateString(),
        now()->subDays(2)->toDateString(),
    ));

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Promo Partner One');
});

it('includes partner and creator relations', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Campaign::factory()->create();

    $response = $this->getJson('/api/campaigns?include=partner,creator');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['partner' => ['id', 'name'], 'creator' => ['id']]]]);
});

// --- STORE ---

it('allows admin to create a campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/campaigns', [
        'partner_id' => $partner->id,
        'type' => 'prospection',
        'channel' => 'sms',
        'name' => 'Campagne Prosp Test',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Campagne Prosp Test')
        ->assertJsonPath('data.partner_id', $partner->id)
        ->assertJsonPath('data.status', 'draft');
});

it('allows partner to create campaign for own partner', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/campaigns', [
        'type' => 'prospection',
        'channel' => 'sms',
        'name' => 'Ma Campagne',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id)
        ->assertJsonPath('data.creator.id', $user->id);
});

it('forces partner_id and user_id for non-admin on store', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/campaigns', [
        'partner_id' => $otherPartner->id,
        'type' => 'prospection',
        'channel' => 'sms',
        'name' => 'Forced Partner',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('validates required fields on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/campaigns', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'type', 'channel', 'partner_id']);
});

it('validates enum values on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $this->postJson('/api/campaigns', [
        'partner_id' => $partner->id,
        'name' => 'Bad Enums',
        'type' => 'invalid_type',
        'channel' => 'invalid_channel',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['type', 'channel']);
});

it('validates sender max 11 alphanumeric chars', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $this->postJson('/api/campaigns', [
        'partner_id' => $partner->id,
        'name' => 'Bad Sender',
        'type' => 'prospection',
        'channel' => 'sms',
        'sender' => 'TooLongSender!@',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['sender']);
});

// --- SHOW ---

it('allows admin to view any campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create(['name' => 'Visible Campaign']);

    $this->getJson("/api/campaigns/{$campaign->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Visible Campaign');
});

it('allows partner to view own campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->create();

    $this->getJson("/api/campaigns/{$campaign->id}")->assertOk();
});

it('denies partner from viewing another partner campaign', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner2)->create();

    $this->getJson("/api/campaigns/{$campaign->id}")->assertForbidden();
});

it('includes interestGroups on show', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create();

    $response = $this->getJson("/api/campaigns/{$campaign->id}?include=interestGroups");

    $response->assertOk()
        ->assertJsonStructure(['data' => ['interest_groups']]);
});

it('includes routing metadata, router relation and recipients_count on show', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();
    $router = Router::factory()->create(['name' => 'Sinch FR']);
    $schema = VariableSchema::factory()->forPartner($partner)->create();
    $routingAt = now()->subMinutes(5)->startOfSecond();

    $campaign = Campaign::factory()->forPartner($partner)->create([
        'routing_status' => CampaignRoutingStatus::RoutingInProgress,
        'router_id' => $router->id,
        'variable_schema_id' => $schema->id,
        'routing_at' => $routingAt,
    ]);

    CampaignRecipient::factory()->count(2)->for($campaign)->create();

    $response = $this->getJson("/api/campaigns/{$campaign->id}?include=router");

    $response->assertOk()
        ->assertJsonPath('data.routing_status', CampaignRoutingStatus::RoutingInProgress->value)
        ->assertJsonPath('data.router_id', $router->id)
        ->assertJsonPath('data.variable_schema_id', $schema->id)
        ->assertJsonPath('data.routing_at', $routingAt->toJSON())
        ->assertJsonPath('data.recipients_count', 2)
        ->assertJsonPath('data.router.id', $router->id)
        ->assertJsonPath('data.router.name', 'Sinch FR');
});

// --- UPDATE ---

it('allows admin to update a campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create();

    $this->putJson("/api/campaigns/{$campaign->id}", ['name' => 'Updated Name'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated Name');
});

it('allows partner to update own campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->create();

    $this->putJson("/api/campaigns/{$campaign->id}", ['name' => 'My Updated Campaign'])
        ->assertOk()
        ->assertJsonPath('data.name', 'My Updated Campaign');
});

it('denies partner from updating another partner campaign', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner2)->create();

    $this->putJson("/api/campaigns/{$campaign->id}", ['name' => 'Hacked'])->assertForbidden();
});

it('denies update on sent campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->sent()->create();

    $this->putJson("/api/campaigns/{$campaign->id}", ['name' => 'Too Late'])
        ->assertForbidden();
});

it('denies update on sending campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create(['status' => CampaignStatus::SENDING]);

    $this->putJson("/api/campaigns/{$campaign->id}", ['name' => 'Too Late'])
        ->assertForbidden();
});

// --- DESTROY ---

it('allows admin to delete a campaign (soft delete)', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create();

    $this->deleteJson("/api/campaigns/{$campaign->id}")->assertOk();

    expect(Campaign::find($campaign->id))->toBeNull()
        ->and(Campaign::withTrashed()->find($campaign->id))->not->toBeNull();
});

it('allows partner to delete own campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->create();

    $this->deleteJson("/api/campaigns/{$campaign->id}")->assertOk();
});

it('denies partner from deleting another partner campaign', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner2)->create();

    $this->deleteJson("/api/campaigns/{$campaign->id}")->assertForbidden();
});

it('denies deleting a sending campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create(['status' => CampaignStatus::SENDING]);

    $this->deleteJson("/api/campaigns/{$campaign->id}")->assertForbidden();
});

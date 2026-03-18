<?php

declare(strict_types=1);

use App\Enums\CampaignRecipientStatus;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Partner;
use App\Models\User;
use App\Models\VariableSchema;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('lists paginated campaign recipients with filters, sorting and merged metadata', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();
    $schema = VariableSchema::factory()->forPartner($partner)->create([
        'global_data' => [
            ['key' => 'm1', 'data' => ['shop_name' => 'Wellpack Nantes']],
        ],
    ]);

    $campaign = Campaign::factory()->forPartner($partner)->create([
        'variable_schema_id' => $schema->id,
    ]);

    $first = CampaignRecipient::factory()->for($campaign)->delivered()->create([
        'phone_number' => '0611000001',
        'message_preview' => 'Bonjour Alice',
        'message_preview_length' => 13,
        'short_url_slug' => 'promo-1',
        'short_url_suffix' => 'abc123',
        'short_url_click' => 3,
        'additional_information' => [
            'global_parameters_key' => 'm1',
            'first_name' => 'Alice',
        ],
        'delivered_at' => now()->subMinute(),
    ]);

    $second = CampaignRecipient::factory()->for($campaign)->failed()->create([
        'phone_number' => '0611000002',
        'message_preview' => 'Bonjour Bob',
        'short_url_click' => 1,
        'additional_information' => [
            'global_parameters_key' => 'm1',
            'first_name' => 'Bob',
        ],
    ]);

    CampaignRecipient::factory()->for($campaign)->create([
        'phone_number' => '0799000000',
        'status' => CampaignRecipientStatus::Queued,
    ]);

    CampaignRecipient::factory()->create([
        'campaign_id' => Campaign::factory(),
        'phone_number' => '0611000099',
        'status' => CampaignRecipientStatus::Delivered,
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/recipients?filter[status]=DELIVERED,FAILED&filter[phone_number]=0611&sort=phone_number&per_page=2");

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.last_page', 1)
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('meta.per_page', 2)
        ->assertJsonPath('data.0.id', $first->id)
        ->assertJsonPath('data.0.phone_number', '0611000001')
        ->assertJsonPath('data.0.status', CampaignRecipientStatus::Delivered->value)
        ->assertJsonPath('data.0.additional_information.shop_name', 'Wellpack Nantes')
        ->assertJsonPath('data.0.additional_information.first_name', 'Alice')
        ->assertJsonPath('data.1.id', $second->id)
        ->assertJsonPath('data.1.status', CampaignRecipientStatus::Failed->value);
});

it('denies partner from listing another partner campaign recipients', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($otherPartner)->create();

    $this->getJson("/api/campaigns/{$campaign->id}/recipients")
        ->assertForbidden();
});

<?php

declare(strict_types=1);

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\PartnerPricing;
use App\Models\TargetingTemplate;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->partner = Partner::factory()->create(['euro_credits' => '1000.00']);
    $this->user = User::factory()->forPartner($this->partner)->create();
    $this->user->assignRole('partner');
    Passport::actingAs($this->user);

    PartnerPricing::factory()->forPartner($this->partner)->default()->create();

    $this->mockSender = Mockery::mock(CampaignSenderInterface::class);
    $this->mockSender->shouldReceive('estimateVolumeFromTargeting')->andReturn(500);
    $this->mockSender->shouldReceive('send')->andReturn(new SendResult(success: true, externalId: 'ext-123'));
    $this->app->instance(CampaignSenderInterface::class, $this->mockSender);
});

it('creates a targeting template after successful send', function (): void {
    $targeting = [
        'zones' => [['code' => '75', 'type' => 'department', 'label' => '75', 'volume' => 500]],
        'method' => 'department',
        'departments' => ['75'],
        'gender' => null,
        'age_min' => 25,
        'age_max' => 60,
    ];

    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'targeting' => $targeting,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    $template = TargetingTemplate::where('partner_id', $this->partner->id)->first();
    expect($template)->not->toBeNull()
        ->and($template->usage_count)->toBe(1)
        ->and($template->last_used_at)->not->toBeNull()
        ->and($template->targeting_json)->toBe($targeting);
});

it('increments usage_count when same targeting exists', function (): void {
    $targeting = [
        'method' => 'department',
        'departments' => ['75'],
        'gender' => null,
        'age_min' => 25,
        'age_max' => 60,
    ];

    TargetingTemplate::factory()->forPartner($this->partner)->create([
        'targeting_json' => $targeting,
        'usage_count' => 3,
    ]);

    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'targeting' => $targeting,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    expect(TargetingTemplate::where('partner_id', $this->partner->id)->count())->toBe(1);
    expect(TargetingTemplate::where('partner_id', $this->partner->id)->first()->usage_count)->toBe(4);
});

it('does not create template for demo campaigns', function (): void {
    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'is_demo' => true,
        'additional_phone' => '0612345678',
        'targeting' => ['method' => 'department', 'departments' => ['75']],
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    expect(TargetingTemplate::where('partner_id', $this->partner->id)->count())->toBe(0);
});

it('does not create template when campaign has no targeting', function (): void {
    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'targeting' => null,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    expect(TargetingTemplate::where('partner_id', $this->partner->id)->count())->toBe(0);
});

it('does not create duplicate when same targeting sent twice', function (): void {
    $targeting = [
        'method' => 'department',
        'departments' => ['92'],
        'gender' => 'F',
        'age_min' => 30,
        'age_max' => 50,
    ];

    $campaign1 = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo 1',
        'sender' => 'WELLPACK',
        'targeting' => $targeting,
    ]);

    $this->postJson("/api/campaigns/{$campaign1->id}/send")->assertOk();

    $campaign2 = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo 2',
        'sender' => 'WELLPACK',
        'targeting' => $targeting,
    ]);

    $this->postJson("/api/campaigns/{$campaign2->id}/send")->assertOk();

    expect(TargetingTemplate::where('partner_id', $this->partner->id)->count())->toBe(1);
    expect(TargetingTemplate::where('partner_id', $this->partner->id)->first()->usage_count)->toBe(2);
});

it('generates correct name for department targeting', function (): void {
    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'targeting' => [
            'method' => 'department',
            'departments' => ['75', '77', '92'],
            'gender' => null,
            'age_min' => 25,
            'age_max' => 60,
        ],
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    $template = TargetingTemplate::where('partner_id', $this->partner->id)->first();
    expect($template->name)->toBe('Zone Dept 75, 77, 92 — Mixte 25-60');
});

it('generates correct name for postcode targeting', function (): void {
    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'targeting' => [
            'method' => 'postcode',
            'postcodes' => ['75001', '75002'],
            'gender' => 'F',
            'age_min' => 30,
            'age_max' => 50,
        ],
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    $template = TargetingTemplate::where('partner_id', $this->partner->id)->first();
    expect($template->name)->toBe('CP 75001, 75002 — Femmes 30-50');
});

it('generates correct name for address targeting', function (): void {
    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'targeting' => [
            'method' => 'address',
            'address' => 'Lyon, France',
            'lat' => 45.764,
            'lng' => 4.8357,
            'radius' => 3000,
            'gender' => 'M',
            'age_min' => 25,
            'age_max' => null,
        ],
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    $template = TargetingTemplate::where('partner_id', $this->partner->id)->first();
    expect($template->name)->toBe('Rayon 3 km — Lyon, France — Hommes 25+');
});

it('generates name with ellipsis for many departments', function (): void {
    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'targeting' => [
            'method' => 'department',
            'departments' => ['75', '77', '92', '93', '94'],
            'gender' => null,
            'age_min' => null,
            'age_max' => null,
        ],
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    $template = TargetingTemplate::where('partner_id', $this->partner->id)->first();
    expect($template->name)->toBe('Zone Dept 75, 77, 92... — Mixte');
});

it('does not create template when send fails', function (): void {
    $failSender = Mockery::mock(CampaignSenderInterface::class);
    $failSender->shouldReceive('estimateVolumeFromTargeting')->andReturn(500);
    $failSender->shouldReceive('send')->andReturn(new SendResult(success: false, externalId: null, error: 'API timeout'));
    $this->app->instance(CampaignSenderInterface::class, $failSender);

    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'targeting' => ['method' => 'department', 'departments' => ['75']],
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertStatus(502);

    expect(TargetingTemplate::where('partner_id', $this->partner->id)->count())->toBe(0);
});

it('creates separate templates for different partners with same targeting', function (): void {
    $partner2 = Partner::factory()->create(['euro_credits' => '1000.00']);
    PartnerPricing::factory()->forPartner($partner2)->default()->create();

    $targeting = ['method' => 'department', 'departments' => ['75']];

    $campaign1 = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'message' => 'Promo 1',
        'sender' => 'WELLPACK',
        'targeting' => $targeting,
    ]);

    $this->postJson("/api/campaigns/{$campaign1->id}/send")->assertOk();

    $user2 = User::factory()->forPartner($partner2)->create();
    $user2->assignRole('partner');
    Passport::actingAs($user2);

    $campaign2 = Campaign::factory()->forPartner($partner2)->forUser($user2)->create([
        'message' => 'Promo 2',
        'sender' => 'WELLPACK',
        'targeting' => $targeting,
    ]);

    $this->postJson("/api/campaigns/{$campaign2->id}/send")->assertOk();

    expect(TargetingTemplate::where('partner_id', $this->partner->id)->count())->toBe(1)
        ->and(TargetingTemplate::where('partner_id', $partner2->id)->count())->toBe(1);
});

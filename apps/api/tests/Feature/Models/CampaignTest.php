<?php

declare(strict_types=1);

use App\Enums\CampaignChannel;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;

it('can create a campaign with required fields', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'name' => 'Campagne Test',
    ]);

    expect($campaign)
        ->name->toBe('Campagne Test')
        ->partner_id->toBe($partner->id)
        ->user_id->toBe($user->id)
        ->status->toBe(CampaignStatus::DRAFT);

    $this->assertDatabaseHas('campaigns', ['name' => 'Campagne Test']);
});

it('can create a prospection campaign', function (): void {
    $campaign = Campaign::factory()->prospection()->create();

    expect($campaign)
        ->type->toBe(CampaignType::PROSPECTION)
        ->channel->toBe(CampaignChannel::SMS);
});

it('can create a fidelisation campaign', function (): void {
    $campaign = Campaign::factory()->fidelisation()->create();

    expect($campaign->type)->toBe(CampaignType::FIDELISATION);
});

it('can create a comptage campaign', function (): void {
    $campaign = Campaign::factory()->comptage()->create();

    expect($campaign->type)->toBe(CampaignType::COMPTAGE);
});

it('can create a scheduled campaign', function (): void {
    $scheduledAt = now()->addDay();
    $campaign = Campaign::factory()->scheduled($scheduledAt)->create();

    expect($campaign)
        ->status->toBe(CampaignStatus::SCHEDULED)
        ->scheduled_at->toBeInstanceOf(DateTimeInterface::class);
});

it('can create a sent campaign', function (): void {
    $campaign = Campaign::factory()->sent()->create();

    expect($campaign)
        ->status->toBe(CampaignStatus::SENT)
        ->sent_at->toBeInstanceOf(DateTimeInterface::class);
});

it('belongs to a partner', function (): void {
    $partner = Partner::factory()->create(['name' => 'Partner Campagne']);
    $campaign = Campaign::factory()->forPartner($partner)->create();

    expect($campaign->partner)
        ->toBeInstanceOf(Partner::class)
        ->name->toBe('Partner Campagne');
});

it('belongs to a user (creator)', function (): void {
    $user = User::factory()->create(['firstname' => 'Jean', 'lastname' => 'Dupont']);
    $campaign = Campaign::factory()->forUser($user)->create();

    expect($campaign->creator)
        ->toBeInstanceOf(User::class)
        ->firstname->toBe('Jean');
});

it('partner has many campaigns', function (): void {
    $partner = Partner::factory()->create();
    Campaign::factory()->count(3)->forPartner($partner)->create();

    expect($partner->campaigns)->toHaveCount(3);
});

it('user has many campaigns', function (): void {
    $user = User::factory()->create();
    Campaign::factory()->count(2)->forUser($user)->create();

    expect($user->campaigns)->toHaveCount(2);
});

it('supports soft deletes', function (): void {
    $campaign = Campaign::factory()->create();
    $campaign->delete();

    expect(Campaign::count())->toBe(0)
        ->and(Campaign::withTrashed()->count())->toBe(1);
});

it('casts enums correctly', function (): void {
    $campaign = Campaign::factory()->prospection()->create();

    expect($campaign->type)->toBeInstanceOf(CampaignType::class)
        ->and($campaign->channel)->toBeInstanceOf(CampaignChannel::class)
        ->and($campaign->status)->toBeInstanceOf(CampaignStatus::class);
});

it('casts targeting as array', function (): void {
    $targeting = [
        'age_min' => 25,
        'age_max' => 65,
        'geo' => ['type' => 'postcode', 'postcodes' => [['code' => '75001', 'volume' => 500]]],
    ];

    $campaign = Campaign::factory()->create(['targeting' => $targeting]);
    $campaign->refresh();

    expect($campaign->targeting)
        ->toBeArray()
        ->and($campaign->targeting['age_min'])->toBe(25)
        ->and($campaign->targeting['geo']['postcodes'][0]['code'])->toBe('75001');
});

it('casts decimal prices correctly', function (): void {
    $campaign = Campaign::factory()->create([
        'unit_price' => 0.0425,
        'total_price' => 212.50,
    ]);
    $campaign->refresh();

    expect($campaign->unit_price)->toBeFloat()
        ->and($campaign->total_price)->toBeFloat();
});

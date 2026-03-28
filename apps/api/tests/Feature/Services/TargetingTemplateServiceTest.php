<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Partner;
use App\Models\TargetingTemplate;
use App\Services\TargetingTemplateService;

// ── computeHash ────────────────────────────────────────────────────

it('computeHash produces consistent hash regardless of key order', function (): void {
    $targeting1 = ['method' => 'department', 'departments' => ['75'], 'gender' => 'M'];
    $targeting2 = ['gender' => 'M', 'departments' => ['75'], 'method' => 'department'];

    expect(TargetingTemplateService::computeHash($targeting1))
        ->toBe(TargetingTemplateService::computeHash($targeting2));
});

it('computeHash produces different hashes for different targeting', function (): void {
    $targeting1 = ['method' => 'department', 'departments' => ['75']];
    $targeting2 = ['method' => 'department', 'departments' => ['77']];

    expect(TargetingTemplateService::computeHash($targeting1))
        ->not->toBe(TargetingTemplateService::computeHash($targeting2));
});

it('computeHash returns a 32-char md5 string', function (): void {
    $hash = TargetingTemplateService::computeHash(['method' => 'department', 'departments' => ['75']]);

    expect($hash)
        ->toBeString()
        ->toHaveLength(32)
        ->toMatch('/^[a-f0-9]{32}$/');
});

// ── autoSaveFromCampaign ───────────────────────────────────────────

it('autoSaveFromCampaign creates a new template', function (): void {
    $partner = Partner::factory()->create();
    $targeting = ['method' => 'department', 'departments' => ['75'], 'gender' => null, 'age_min' => 25, 'age_max' => 60];

    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->create([
            'targeting' => $targeting,
            'is_demo' => false,
        ]);

    $service = app(TargetingTemplateService::class);
    $template = $service->autoSaveFromCampaign($campaign);

    expect($template)->not->toBeNull();
    expect($template->partner_id)->toBe($partner->id);
    expect($template->targeting_json)->toBe($targeting);
    expect($template->targeting_hash)->toBe(TargetingTemplateService::computeHash($targeting));
    expect($template->usage_count)->toBe(1);
    expect($template->last_used_at)->not->toBeNull();
});

it('autoSaveFromCampaign increments usage on duplicate targeting', function (): void {
    $partner = Partner::factory()->create();
    $targeting = ['method' => 'department', 'departments' => ['75'], 'gender' => null, 'age_min' => 25, 'age_max' => 60];
    $hash = TargetingTemplateService::computeHash($targeting);

    $existing = TargetingTemplate::factory()->forPartner($partner)->create([
        'targeting_json' => $targeting,
        'targeting_hash' => $hash,
        'usage_count' => 3,
        'last_used_at' => now()->subDays(5),
    ]);

    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->create([
            'targeting' => $targeting,
            'is_demo' => false,
        ]);

    $service = app(TargetingTemplateService::class);
    $result = $service->autoSaveFromCampaign($campaign);

    expect($result->id)->toBe($existing->id);

    $existing->refresh();
    expect($existing->usage_count)->toBe(4);
    expect($existing->last_used_at->isToday())->toBeTrue();
});

it('autoSaveFromCampaign returns null for demo campaigns', function (): void {
    $partner = Partner::factory()->create();
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->demo()
        ->create([
            'targeting' => ['method' => 'department', 'departments' => ['75']],
        ]);

    $service = app(TargetingTemplateService::class);
    expect($service->autoSaveFromCampaign($campaign))->toBeNull();
});

it('autoSaveFromCampaign returns null when no targeting', function (): void {
    $partner = Partner::factory()->create();
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->create([
            'targeting' => null,
            'is_demo' => false,
        ]);

    $service = app(TargetingTemplateService::class);
    expect($service->autoSaveFromCampaign($campaign))->toBeNull();
});

it('autoSaveFromCampaign returns null when partner_id is falsy', function (): void {
    // Simulate a campaign with partner_id zeroed out in memory (DB constraint prevents null)
    $partner = Partner::factory()->create();
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->create([
            'targeting' => ['method' => 'department', 'departments' => ['75']],
            'is_demo' => false,
        ]);

    // Override partner_id in memory to test the guard clause
    $campaign->partner_id = 0;

    $service = app(TargetingTemplateService::class);
    expect($service->autoSaveFromCampaign($campaign))->toBeNull();
});

// ── generateName ───────────────────────────────────────────────────

it('generateName formats department targeting', function (): void {
    $service = app(TargetingTemplateService::class);
    $name = $service->generateName([
        'method' => 'department',
        'departments' => ['75', '77', '78'],
        'gender' => 'M',
        'age_min' => 25,
        'age_max' => 60,
    ]);

    expect($name)->toBe('Zone Dept 75, 77, 78 — Hommes 25-60');
});

it('generateName truncates departments over 3', function (): void {
    $service = app(TargetingTemplateService::class);
    $name = $service->generateName([
        'method' => 'department',
        'departments' => ['75', '77', '78', '91', '92'],
        'gender' => null,
    ]);

    expect($name)->toBe('Zone Dept 75, 77, 78... — Mixte');
});

it('generateName formats postcode targeting', function (): void {
    $service = app(TargetingTemplateService::class);
    $name = $service->generateName([
        'method' => 'postcode',
        'postcodes' => ['75001', '75002'],
        'gender' => 'F',
        'age_min' => 30,
        'age_max' => null,
    ]);

    expect($name)->toBe('CP 75001, 75002 — Femmes 30+');
});

it('generateName formats address targeting', function (): void {
    $service = app(TargetingTemplateService::class);
    $name = $service->generateName([
        'method' => 'address',
        'address' => '10 rue de Rivoli, Paris',
        'radius' => 5000,
        'gender' => null,
        'age_min' => null,
        'age_max' => null,
    ]);

    expect($name)->toBe('Rayon 5 km — 10 rue de Rivoli, Pa — Mixte');
});

it('generateName falls back to generic for unknown method', function (): void {
    $service = app(TargetingTemplateService::class);
    $name = $service->generateName([
        'method' => 'custom',
        'gender' => 'M',
        'age_min' => 18,
        'age_max' => 35,
    ]);

    expect($name)->toBe('Zone Hommes 18-35');
});

// ── model backward compatibility ───────────────────────────────────

it('TargetingTemplate getTargetingHash matches computeHash', function (): void {
    $targeting = ['method' => 'department', 'departments' => ['75'], 'gender' => 'M'];
    $template = TargetingTemplate::factory()->create([
        'targeting_json' => $targeting,
    ]);

    expect($template->getTargetingHash())
        ->toBe(TargetingTemplateService::computeHash($targeting));
});

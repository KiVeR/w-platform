<?php

declare(strict_types=1);

use App\Events\CampaignDispatched;
use App\Listeners\AutoSaveTargetingTemplate;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\TargetingTemplate;
use App\Services\TargetingTemplateService;

// ── handle with method='send' ───────────────────────────────────────

it('creates a targeting template when method is send', function (): void {
    $partner = Partner::factory()->create();
    $campaign = Campaign::factory()->create([
        'partner_id' => $partner->id,
        'targeting' => ['method' => 'department', 'departments' => ['75']],
        'is_demo' => false,
    ]);

    $listener = new AutoSaveTargetingTemplate(new TargetingTemplateService());
    $event = new CampaignDispatched($campaign, 'send');

    $listener->handle($event);

    expect(TargetingTemplate::where('partner_id', $partner->id)->count())->toBe(1);
});

it('increments usage_count when identical targeting already exists and method is send', function (): void {
    $partner = Partner::factory()->create();
    $targeting = ['method' => 'department', 'departments' => ['75']];
    $hash = TargetingTemplateService::computeHash($targeting);

    $template = TargetingTemplate::factory()->create([
        'partner_id' => $partner->id,
        'targeting_json' => $targeting,
        'targeting_hash' => $hash,
        'usage_count' => 1,
    ]);

    $campaign = Campaign::factory()->create([
        'partner_id' => $partner->id,
        'targeting' => $targeting,
        'is_demo' => false,
    ]);

    $listener = new AutoSaveTargetingTemplate(new TargetingTemplateService());
    $event = new CampaignDispatched($campaign, 'send');

    $listener->handle($event);

    expect($template->fresh()->usage_count)->toBe(2);
    expect(TargetingTemplate::where('partner_id', $partner->id)->count())->toBe(1);
});

// ── handle with method='schedule' ──────────────────────────────────

it('does nothing when method is schedule', function (): void {
    $partner = Partner::factory()->create();
    $campaign = Campaign::factory()->create([
        'partner_id' => $partner->id,
        'targeting' => ['method' => 'department', 'departments' => ['75']],
        'is_demo' => false,
    ]);

    $listener = new AutoSaveTargetingTemplate(new TargetingTemplateService());
    $event = new CampaignDispatched($campaign, 'schedule');

    $listener->handle($event);

    expect(TargetingTemplate::where('partner_id', $partner->id)->count())->toBe(0);
});

// ── event wiring ────────────────────────────────────────────────────

it('dispatching CampaignDispatched event triggers AutoSaveTargetingTemplate listener', function (): void {
    $partner = Partner::factory()->create();
    $campaign = Campaign::factory()->create([
        'partner_id' => $partner->id,
        'targeting' => ['method' => 'department', 'departments' => ['77']],
        'is_demo' => false,
    ]);

    CampaignDispatched::dispatch($campaign, 'send');

    expect(TargetingTemplate::where('partner_id', $partner->id)->count())->toBe(1);
});

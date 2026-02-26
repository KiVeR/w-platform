<?php

declare(strict_types=1);

use App\Models\TargetingTemplate;
use Database\Seeders\TargetingTemplateSeeder;

it('creates 7 preset templates', function (): void {
    $this->seed(TargetingTemplateSeeder::class);

    expect(TargetingTemplate::where('is_preset', true)->count())->toBe(7);
});

it('creates presets with correct categories', function (): void {
    $this->seed(TargetingTemplateSeeder::class);

    $categories = TargetingTemplate::where('is_preset', true)
        ->pluck('category')
        ->sort()
        ->values()
        ->toArray();

    expect($categories)->toBe(['automobile', 'commerce', 'fleuriste', 'immobilier', 'menuiserie', 'optique', 'thermalisme']);
});

it('creates presets with null partner_id', function (): void {
    $this->seed(TargetingTemplateSeeder::class);

    expect(TargetingTemplate::where('is_preset', true)->whereNotNull('partner_id')->count())->toBe(0);
});

it('is idempotent (running twice does not duplicate)', function (): void {
    $this->seed(TargetingTemplateSeeder::class);
    $this->seed(TargetingTemplateSeeder::class);

    expect(TargetingTemplate::where('is_preset', true)->count())->toBe(7);
});

it('creates presets with valid targeting_json', function (): void {
    $this->seed(TargetingTemplateSeeder::class);

    $presets = TargetingTemplate::where('is_preset', true)->get();

    foreach ($presets as $preset) {
        expect($preset->targeting_json)->toBeArray()
            ->and($preset->targeting_json)->toHaveKey('method')
            ->and($preset->targeting_json['method'])->toBeIn(['department', 'postcode', 'address']);
    }
});

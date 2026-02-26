<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\TargetingTemplate;

it('belongs to partner', function (): void {
    $partner = Partner::factory()->create();
    $template = TargetingTemplate::factory()->forPartner($partner)->create();

    expect($template->partner->id)->toBe($partner->id);
});

it('soft deletes', function (): void {
    $template = TargetingTemplate::factory()->create();
    $template->delete();

    expect(TargetingTemplate::find($template->id))->toBeNull()
        ->and(TargetingTemplate::withTrashed()->find($template->id))->not->toBeNull();
});

it('casts targeting_json as array', function (): void {
    $template = TargetingTemplate::factory()->create([
        'targeting_json' => ['method' => 'department', 'departments' => ['75']],
    ]);

    expect($template->targeting_json)->toBeArray()
        ->and($template->targeting_json['method'])->toBe('department');
});

it('casts is_preset as boolean', function (): void {
    $template = TargetingTemplate::factory()->preset()->create();

    expect($template->is_preset)->toBeTrue();
});

it('casts last_used_at as datetime', function (): void {
    $template = TargetingTemplate::factory()->used()->create();

    expect($template->last_used_at)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});

it('scopes forUser for non-admin', function (): void {
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    TargetingTemplate::factory()->forPartner($partner1)->count(2)->create();
    TargetingTemplate::factory()->forPartner($partner2)->count(3)->create();

    $user = \App\Models\User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');

    $results = TargetingTemplate::forUser($user)->get();

    expect($results)->toHaveCount(2);
});

it('scopes forUser returns all for admin', function (): void {
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

    TargetingTemplate::factory()->count(5)->create();

    $admin = \App\Models\User::factory()->create();
    $admin->assignRole('admin');

    $results = TargetingTemplate::forUser($admin)->get();

    expect($results)->toHaveCount(5);
});

it('scopes presets', function (): void {
    TargetingTemplate::factory()->count(3)->create();
    TargetingTemplate::factory()->preset()->count(2)->create();

    expect(TargetingTemplate::presets()->count())->toBe(2);
});

it('scopes byCategory', function (): void {
    TargetingTemplate::factory()->preset('commerce')->count(2)->create();
    TargetingTemplate::factory()->preset('optique')->create();

    expect(TargetingTemplate::byCategory('commerce')->count())->toBe(2);
});

it('generates targeting hash', function (): void {
    $template1 = TargetingTemplate::factory()->create([
        'targeting_json' => ['age_min' => 25, 'method' => 'department', 'departments' => ['75']],
    ]);
    $template2 = TargetingTemplate::factory()->create([
        'targeting_json' => ['method' => 'department', 'departments' => ['75'], 'age_min' => 25],
    ]);
    $template3 = TargetingTemplate::factory()->create([
        'targeting_json' => ['method' => 'department', 'departments' => ['92']],
    ]);

    expect($template1->getTargetingHash())->toBe($template2->getTargetingHash())
        ->and($template1->getTargetingHash())->not->toBe($template3->getTargetingHash());
});

it('allows null partner_id for presets', function (): void {
    $template = TargetingTemplate::factory()->preset()->create();

    expect($template->partner_id)->toBeNull()
        ->and($template->is_preset)->toBeTrue();
});

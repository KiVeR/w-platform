<?php

declare(strict_types=1);

use App\Enums\LandingPageStatus;
use App\Models\Campaign;
use App\Models\LandingPage;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('belongs to partner', function (): void {
    $partner = Partner::factory()->create();
    $lp = LandingPage::factory()->forPartner($partner)->create();

    expect($lp->partner->id)->toBe($partner->id);
});

it('belongs to creator (user)', function (): void {
    $user = User::factory()->create();
    $lp = LandingPage::factory()->forUser($user)->create();

    expect($lp->creator->id)->toBe($user->id);
});

it('has many campaigns', function (): void {
    $partner = Partner::factory()->create();
    $lp = LandingPage::factory()->forPartner($partner)->create();
    Campaign::factory()->forPartner($partner)->count(2)->create([
        'landing_page_id' => $lp->id,
    ]);

    expect($lp->campaigns)->toHaveCount(2);
});

it('soft deletes', function (): void {
    $lp = LandingPage::factory()->create();
    $lp->delete();

    expect(LandingPage::find($lp->id))->toBeNull()
        ->and(LandingPage::withTrashed()->find($lp->id))->not->toBeNull();
});

it('casts status as enum', function (): void {
    $lp = LandingPage::factory()->published()->create();

    expect($lp->status)->toBe(LandingPageStatus::PUBLISHED);
});

it('casts design as array', function (): void {
    $lp = LandingPage::factory()->withDesign()->create();

    expect($lp->design)->toBeArray()
        ->and($lp->design['version'])->toBe('1.0');
});

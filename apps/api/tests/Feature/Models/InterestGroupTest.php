<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Interest;
use App\Models\InterestGroup;
use App\Models\Partner;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can create an interest group with required fields', function (): void {
    $group = InterestGroup::factory()->create([
        'label' => 'Habitat',
    ]);

    expect($group)
        ->label->toBe('Habitat')
        ->is_active->toBeTrue();

    $this->assertDatabaseHas('interest_groups', ['label' => 'Habitat']);
});

it('supports parent-child hierarchy', function (): void {
    $parent = InterestGroup::factory()->create(['label' => 'Habitat']);
    $child = InterestGroup::factory()->forParent($parent)->create(['label' => 'Maison']);

    expect($child->parent)
        ->toBeInstanceOf(InterestGroup::class)
        ->label->toBe('Habitat');

    expect($parent->children)->toHaveCount(1)
        ->and($parent->children->first()->label)->toBe('Maison');
});

it('supports 3-level hierarchy', function (): void {
    $level0 = InterestGroup::factory()->create(['label' => 'Habitat']);
    $level1 = InterestGroup::factory()->forParent($level0)->create(['label' => 'Maison']);
    $level2 = InterestGroup::factory()->forParent($level1)->create(['label' => 'Jardin']);

    expect($level0->children)->toHaveCount(1)
        ->and($level0->children->first()->children)->toHaveCount(1)
        ->and($level0->children->first()->children->first()->label)->toBe('Jardin');
});

it('has many interests', function (): void {
    $group = InterestGroup::factory()->create();
    Interest::factory()->count(3)->forGroup($group)->create();

    expect($group->interests)->toHaveCount(3);
});

it('can be attached to campaigns via pivot', function (): void {
    $group = InterestGroup::factory()->create();
    $campaign = Campaign::factory()->create();

    $campaign->interestGroups()->attach($group->id, [
        'index' => 1,
        'operator' => 'AND',
    ]);

    expect($campaign->interestGroups)->toHaveCount(1)
        ->and($campaign->interestGroups->first()->pivot->index)->toBe(1)
        ->and($campaign->interestGroups->first()->pivot->operator)->toBe('AND');
});

it('can be hidden for specific partners', function (): void {
    $group = InterestGroup::factory()->create();
    $partner = Partner::factory()->create();

    $group->hiddenForPartners()->attach($partner->id);

    expect($group->hiddenForPartners)->toHaveCount(1)
        ->and($group->hiddenForPartners->first()->id)->toBe($partner->id);
});

it('casts is_active as boolean', function (): void {
    $group = InterestGroup::factory()->create(['is_active' => true]);

    expect($group->is_active)->toBeTrue()->toBeBool();
});

it('allows nullable parent_id for root groups', function (): void {
    $group = InterestGroup::factory()->create(['parent_id' => null]);

    expect($group->parent_id)->toBeNull()
        ->and($group->parent)->toBeNull();
});

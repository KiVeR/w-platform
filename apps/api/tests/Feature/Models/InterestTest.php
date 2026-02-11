<?php

declare(strict_types=1);

use App\Models\Interest;
use App\Models\InterestGroup;

it('can create an interest with required fields', function (): void {
    $group = InterestGroup::factory()->create();
    $interest = Interest::factory()->forGroup($group)->create([
        'wellpack_id' => 42,
        'label' => 'Bricolage',
        'type' => 'interest',
    ]);

    expect($interest)
        ->wellpack_id->toBe(42)
        ->label->toBe('Bricolage')
        ->type->toBe('interest')
        ->is_active->toBeTrue();

    $this->assertDatabaseHas('interests', ['wellpack_id' => 42]);
});

it('belongs to an interest group', function (): void {
    $group = InterestGroup::factory()->create(['label' => 'Habitat']);
    $interest = Interest::factory()->forGroup($group)->create();

    expect($interest->group)
        ->toBeInstanceOf(InterestGroup::class)
        ->label->toBe('Habitat');
});

it('enforces unique wellpack_id', function (): void {
    Interest::factory()->create(['wellpack_id' => 100]);

    expect(fn () => Interest::factory()->create(['wellpack_id' => 100]))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

it('supports qualif type', function (): void {
    $interest = Interest::factory()->qualif()->create();

    expect($interest->type)->toBe('qualif');
});

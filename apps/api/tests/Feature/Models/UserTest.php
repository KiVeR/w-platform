<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can create a user with required fields', function (): void {
    $user = User::factory()->create([
        'firstname' => 'John',
        'lastname' => 'Doe',
        'email' => 'john@example.com',
    ]);

    expect($user)
        ->firstname->toBe('John')
        ->lastname->toBe('Doe')
        ->email->toBe('john@example.com')
        ->is_active->toBeTrue();

    $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
});

it('computes full_name from firstname and lastname', function (): void {
    $user = User::factory()->create([
        'firstname' => 'Jane',
        'lastname' => 'Smith',
    ]);

    expect($user->full_name)->toBe('Jane Smith');
});

it('reports active status correctly', function (): void {
    $active = User::factory()->create(['is_active' => true]);
    $inactive = User::factory()->inactive()->create();

    expect($active->isActive())->toBeTrue()
        ->and($inactive->isActive())->toBeFalse();
});

it('can be assigned a role', function (): void {
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('admin');

    expect($user->hasRole('admin'))->toBeTrue()
        ->and($user->hasRole('partner'))->toBeFalse();
});

it('belongs to a partner', function (): void {
    $partner = Partner::factory()->create(['name' => 'Acme Corp']);
    $user = User::factory()->forPartner($partner)->create();

    expect($user->partner)
        ->toBeInstanceOf(Partner::class)
        ->name->toBe('Acme Corp');
});

it('scopes active users', function (): void {
    User::factory()->count(3)->create(['is_active' => true]);
    User::factory()->count(2)->inactive()->create();

    expect(User::active()->count())->toBe(3);
});

it('hides password in serialization', function (): void {
    $user = User::factory()->create();
    $array = $user->toArray();

    expect($array)->not->toHaveKey('password');
});

it('supports soft deletes', function (): void {
    $user = User::factory()->create();
    $user->delete();

    expect(User::count())->toBe(0)
        ->and(User::withTrashed()->count())->toBe(1);
});

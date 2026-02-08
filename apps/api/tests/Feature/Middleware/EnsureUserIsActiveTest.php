<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    app(ClientRepository::class)->createPersonalAccessGrantClient('Wellpack Personal Access Client');
});

it('allows active user with correct role through', function (): void {
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole('admin');

    Passport::actingAs($user);

    $this->getJson('/api/auth/me')
        ->assertOk();
});

it('blocks inactive user with 403', function (): void {
    $user = User::factory()->inactive()->create();
    $user->assignRole('admin');

    Passport::actingAs($user);

    $this->getJson('/api/auth/me')
        ->assertForbidden()
        ->assertJsonPath('message', 'Your account has been deactivated.');
});

it('returns 401 for unauthenticated request', function (): void {
    $this->getJson('/api/auth/me')
        ->assertUnauthorized();
});

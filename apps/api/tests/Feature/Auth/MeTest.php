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

it('returns authenticated user info', function (): void {
    $user = User::factory()->create([
        'firstname' => 'Jane',
        'lastname' => 'Doe',
    ]);
    $user->assignRole('partner');

    Passport::actingAs($user);

    $this->getJson('/api/auth/me')
        ->assertOk()
        ->assertJsonStructure([
            'data' => ['id', 'firstname', 'lastname', 'full_name', 'email', 'roles', 'permissions'],
        ])
        ->assertJsonPath('data.firstname', 'Jane')
        ->assertJsonPath('data.lastname', 'Doe')
        ->assertJsonPath('data.full_name', 'Jane Doe');
});

it('returns 401 when not authenticated', function (): void {
    $this->getJson('/api/auth/me')
        ->assertUnauthorized();
});

it('returns 403 for inactive authenticated user', function (): void {
    $user = User::factory()->inactive()->create();

    Passport::actingAs($user);

    $this->getJson('/api/auth/me')
        ->assertForbidden()
        ->assertJsonPath('message', 'Your account has been deactivated.');
});

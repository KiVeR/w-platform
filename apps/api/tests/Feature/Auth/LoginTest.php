<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\ClientRepository;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    app(ClientRepository::class)->createPersonalAccessGrantClient('Wellpack Personal Access Client');
});

it('logs in with valid credentials and returns tokens', function (): void {
    $user = User::factory()->create([
        'email' => 'user@example.com',
        'password' => 'secret123',
    ]);
    $user->assignRole('partner');

    $response = $this->postJson('/api/auth/login', [
        'email' => 'user@example.com',
        'password' => 'secret123',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'access_token',
                'token_type',
                'expires_in',
                'refresh_token',
                'user' => ['id', 'firstname', 'lastname', 'full_name', 'email', 'roles'],
            ],
        ])
        ->assertJsonPath('data.token_type', 'Bearer')
        ->assertJsonPath('data.user.email', 'user@example.com');
});

it('returns 401 for invalid email', function (): void {
    $this->postJson('/api/auth/login', [
        'email' => 'nonexistent@example.com',
        'password' => 'secret123',
    ])->assertUnauthorized()
        ->assertJsonPath('message', 'Invalid credentials.');
});

it('returns 401 for invalid password', function (): void {
    User::factory()->create([
        'email' => 'user@example.com',
        'password' => 'secret123',
    ]);

    $this->postJson('/api/auth/login', [
        'email' => 'user@example.com',
        'password' => 'wrongpassword',
    ])->assertUnauthorized()
        ->assertJsonPath('message', 'Invalid credentials.');
});

it('returns 403 for inactive account', function (): void {
    User::factory()->inactive()->create([
        'email' => 'inactive@example.com',
        'password' => 'secret123',
    ]);

    $this->postJson('/api/auth/login', [
        'email' => 'inactive@example.com',
        'password' => 'secret123',
    ])->assertForbidden()
        ->assertJsonPath('message', 'Your account has been deactivated.');
});

it('validates email is required', function (): void {
    $this->postJson('/api/auth/login', [
        'password' => 'secret123',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('validates email format', function (): void {
    $this->postJson('/api/auth/login', [
        'email' => 'not-an-email',
        'password' => 'secret123',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('validates password is required and min 8 chars', function (): void {
    $this->postJson('/api/auth/login', [
        'email' => 'user@example.com',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);

    $this->postJson('/api/auth/login', [
        'email' => 'user@example.com',
        'password' => 'short',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

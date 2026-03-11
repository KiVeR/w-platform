<?php

declare(strict_types=1);

use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Passport\ClientRepository;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    app(ClientRepository::class)->createPersonalAccessGrantClient('Wellpack Personal Access Client');
    RateLimiter::clear('auth');
});

it('blocks login after 5 failed attempts from same IP', function (): void {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/auth/login', [
            'email' => 'brute@example.com',
            'password' => 'wrongpassword',
        ])->assertUnauthorized();
    }

    $this->postJson('/api/auth/login', [
        'email' => 'brute@example.com',
        'password' => 'wrongpassword',
    ])->assertStatus(429);
});

it('blocks social login after 5 attempts from same IP', function (): void {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/auth/social/login', [
            'provider' => 'google',
            'token' => 'invalid-token-'.$i,
        ])->assertUnauthorized();
    }

    $this->postJson('/api/auth/social/login', [
        'provider' => 'google',
        'token' => 'invalid-token-final',
    ])->assertStatus(429);
});

it('blocks refresh after 5 attempts from same IP', function (): void {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/auth/refresh', [
            'refresh_token' => 'invalid-refresh-token-'.$i,
        ])->assertUnauthorized();
    }

    $this->postJson('/api/auth/refresh', [
        'refresh_token' => 'invalid-refresh-token-final',
    ])->assertStatus(429);
});

it('returns 429 with retry-after header when rate limit exceeded', function (): void {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/auth/login', [
            'email' => 'brute@example.com',
            'password' => 'wrongpassword',
        ]);
    }

    $response = $this->postJson('/api/auth/login', [
        'email' => 'brute@example.com',
        'password' => 'wrongpassword',
    ]);

    $response->assertStatus(429)
        ->assertHeader('Retry-After');
});

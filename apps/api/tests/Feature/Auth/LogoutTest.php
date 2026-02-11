<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    app(ClientRepository::class)->createPersonalAccessGrantClient('Wellpack Personal Access Client');
});

it('logs out and revokes token', function (): void {
    $user = User::factory()->create();
    $tokenResult = $user->createToken('auth-token');

    $this->withHeader('Authorization', 'Bearer '.$tokenResult->accessToken)
        ->postJson('/api/auth/logout')
        ->assertOk()
        ->assertJsonPath('message', 'Successfully logged out.');

    // Token should be revoked
    $token = $tokenResult->token->fresh();
    expect($token->revoked)->toBeTrue();
});

it('revokes associated refresh tokens on logout', function (): void {
    $user = User::factory()->create();
    $tokenResult = $user->createToken('auth-token');
    $token = $tokenResult->token;

    $refreshTokenModel = Passport::refreshTokenModel();
    $refreshTokenModel::create([
        'id' => 'test-refresh-token',
        'access_token_id' => $token->id,
        'revoked' => false,
        'expires_at' => now()->addDays(30),
    ]);

    $this->withHeader('Authorization', 'Bearer '.$tokenResult->accessToken)
        ->postJson('/api/auth/logout')
        ->assertOk();

    $refreshToken = $refreshTokenModel::find('test-refresh-token');
    expect($refreshToken->revoked)->toBeTrue();
});

it('returns 401 when not authenticated', function (): void {
    $this->postJson('/api/auth/logout')
        ->assertUnauthorized();
});

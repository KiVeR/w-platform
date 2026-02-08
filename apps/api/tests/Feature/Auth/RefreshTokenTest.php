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

function createUserWithTokens(): array
{
    $user = User::factory()->create(['password' => 'secret123']);
    $tokenResult = $user->createToken('auth-token');
    $token = $tokenResult->token;

    $refreshTokenId = \Illuminate\Support\Str::random(64);
    $refreshTokenModel = Passport::refreshTokenModel();
    $refreshTokenModel::create([
        'id' => $refreshTokenId,
        'access_token_id' => $token->id,
        'revoked' => false,
        'expires_at' => now()->addDays(30),
    ]);

    return [
        'user' => $user,
        'access_token' => $tokenResult->accessToken,
        'access_token_id' => $token->id,
        'refresh_token' => $refreshTokenId,
    ];
}

it('refreshes tokens with valid refresh token', function (): void {
    $data = createUserWithTokens();

    $response = $this->postJson('/api/auth/refresh', [
        'refresh_token' => $data['refresh_token'],
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'access_token',
                'token_type',
                'expires_in',
                'refresh_token',
                'user' => ['id', 'email'],
            ],
        ]);

    // Old refresh token should be revoked
    $refreshTokenModel = Passport::refreshTokenModel();
    $oldRefresh = $refreshTokenModel::find($data['refresh_token']);
    expect($oldRefresh->revoked)->toBeTrue();
});

it('returns 401 for invalid refresh token', function (): void {
    $this->postJson('/api/auth/refresh', [
        'refresh_token' => 'invalid-token-that-does-not-exist',
    ])->assertUnauthorized()
        ->assertJsonPath('message', 'Invalid refresh token.');
});

it('returns 401 for expired refresh token', function (): void {
    $data = createUserWithTokens();

    $refreshTokenModel = Passport::refreshTokenModel();
    $refreshTokenModel::where('id', $data['refresh_token'])->update([
        'expires_at' => now()->subDay(),
    ]);

    $this->postJson('/api/auth/refresh', [
        'refresh_token' => $data['refresh_token'],
    ])->assertUnauthorized()
        ->assertJsonPath('message', 'Invalid refresh token.');
});

it('returns 401 for revoked refresh token', function (): void {
    $data = createUserWithTokens();

    $refreshTokenModel = Passport::refreshTokenModel();
    $refreshTokenModel::where('id', $data['refresh_token'])->update([
        'revoked' => true,
    ]);

    $this->postJson('/api/auth/refresh', [
        'refresh_token' => $data['refresh_token'],
    ])->assertUnauthorized()
        ->assertJsonPath('message', 'Invalid refresh token.');
});

it('validates refresh_token is required', function (): void {
    $this->postJson('/api/auth/refresh', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['refresh_token']);
});

<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\ClientRepository;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User as SocialiteUser;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    app(ClientRepository::class)->createPersonalAccessGrantClient('Wellpack Personal Access Client');
});

function mockSocialiteUser(string $email, string $id = '123456', string $name = 'John Doe'): void
{
    $socialiteUser = new SocialiteUser;
    $socialiteUser->id = $id;
    $socialiteUser->email = $email;
    $socialiteUser->name = $name;
    $socialiteUser->user = [
        'given_name' => 'John',
        'family_name' => 'Doe',
    ];

    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('stateless')->andReturnSelf();
    $provider->shouldReceive('userFromToken')->andReturn($socialiteUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
}

it('creates a new user via google login', function (): void {
    mockSocialiteUser('newuser@wellpack.fr', '789');

    $response = $this->postJson('/api/auth/social/login', [
        'provider' => 'google',
        'token' => 'valid-google-token',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'access_token',
                'token_type',
                'expires_in',
                'refresh_token',
                'user' => ['id', 'firstname', 'lastname', 'email'],
            ],
        ])
        ->assertJsonPath('data.user.email', 'newuser@wellpack.fr');

    $this->assertDatabaseHas('users', [
        'email' => 'newuser@wellpack.fr',
        'google_id' => '789',
    ]);
});

it('logs in existing user via google', function (): void {
    $user = User::factory()->create([
        'email' => 'existing@wellpack.fr',
        'google_id' => '123456',
    ]);

    mockSocialiteUser('existing@wellpack.fr', '123456');

    $response = $this->postJson('/api/auth/social/login', [
        'provider' => 'google',
        'token' => 'valid-google-token',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.user.id', $user->id);

    expect(User::where('email', 'existing@wellpack.fr')->count())->toBe(1);
});

it('returns 401 for invalid google token', function (): void {
    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('stateless')->andReturnSelf();
    $provider->shouldReceive('userFromToken')->andThrow(new Exception('Invalid token'));

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $this->postJson('/api/auth/social/login', [
        'provider' => 'google',
        'token' => 'invalid-token',
    ])->assertUnauthorized()
        ->assertJsonPath('message', 'Invalid social token.');
});

it('returns 403 for inactive account via social login', function (): void {
    User::factory()->inactive()->create([
        'email' => 'inactive@wellpack.fr',
        'google_id' => '999',
    ]);

    mockSocialiteUser('inactive@wellpack.fr', '999');

    $this->postJson('/api/auth/social/login', [
        'provider' => 'google',
        'token' => 'valid-token',
    ])->assertForbidden()
        ->assertJsonPath('message', 'Your account has been deactivated.');
});

it('validates social login request', function (): void {
    $this->postJson('/api/auth/social/login', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['provider', 'token']);

    $this->postJson('/api/auth/social/login', [
        'provider' => 'facebook',
        'token' => 'some-token',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['provider']);
});

it('rejects social login from unauthorized email domain', function (): void {
    mockSocialiteUser('user@gmail.com', '456');

    $this->postJson('/api/auth/social/login', [
        'provider' => 'google',
        'token' => 'valid-google-token',
    ])->assertForbidden()
        ->assertJsonPath('message', 'Email domain not allowed.');

    $this->assertDatabaseMissing('users', ['email' => 'user@gmail.com']);
});

it('accepts social login from authorized email domain', function (): void {
    mockSocialiteUser('user@wellpack.fr', '789');

    $this->postJson('/api/auth/social/login', [
        'provider' => 'google',
        'token' => 'valid-google-token',
    ])->assertOk()
        ->assertJsonPath('data.user.email', 'user@wellpack.fr');
});

it('allows any domain when ALLOWED_EMAIL_DOMAIN is empty', function (): void {
    config(['auth.allowed_email_domain' => null]);

    mockSocialiteUser('anyone@external.com', '101');

    $this->postJson('/api/auth/social/login', [
        'provider' => 'google',
        'token' => 'valid-google-token',
    ])->assertOk()
        ->assertJsonPath('data.user.email', 'anyone@external.com');
});

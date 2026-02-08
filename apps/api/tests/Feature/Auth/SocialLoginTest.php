<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\ClientRepository;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User as SocialiteUser;

uses(RefreshDatabase::class);

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
    mockSocialiteUser('newuser@gmail.com', '789');

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
        ->assertJsonPath('data.user.email', 'newuser@gmail.com');

    $this->assertDatabaseHas('users', [
        'email' => 'newuser@gmail.com',
        'google_id' => '789',
    ]);
});

it('logs in existing user via google', function (): void {
    $user = User::factory()->create([
        'email' => 'existing@gmail.com',
        'google_id' => '123456',
    ]);

    mockSocialiteUser('existing@gmail.com', '123456');

    $response = $this->postJson('/api/auth/social/login', [
        'provider' => 'google',
        'token' => 'valid-google-token',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.user.id', $user->id);

    expect(User::where('email', 'existing@gmail.com')->count())->toBe(1);
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
        'email' => 'inactive@gmail.com',
        'google_id' => '999',
    ]);

    mockSocialiteUser('inactive@gmail.com', '999');

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

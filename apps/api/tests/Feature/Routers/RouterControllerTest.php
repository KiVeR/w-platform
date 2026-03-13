<?php

declare(strict_types=1);

use App\Models\Router;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('allows admin to list routers', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Router::factory()->create([
        'name' => 'Infobip',
        'external_id' => 2,
        'num_stop' => '36111',
        'is_active' => true,
    ]);
    Router::factory()->create([
        'name' => 'Sinch',
        'external_id' => 1,
        'num_stop' => '36063',
        'is_active' => false,
    ]);

    $response = $this->getJson('/api/routers');

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonStructure([
            'data' => [[
                'id',
                'name',
                'external_id',
                'num_stop',
                'is_active',
                'created_at',
                'updated_at',
            ]],
            'links',
            'meta',
        ]);
});

it('denies employee from listing routers', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/routers')->assertForbidden();
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/routers')->assertUnauthorized();
});

it('filters routers by name', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Router::factory()->create(['name' => 'Infobip']);
    Router::factory()->create(['name' => 'Sinch']);

    $response = $this->getJson('/api/routers?filter[name]=Info');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Infobip');
});

it('filters routers by active flag', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Router::factory()->create(['name' => 'Infobip', 'is_active' => true]);
    Router::factory()->create(['name' => 'Sinch', 'is_active' => false]);

    $response = $this->getJson('/api/routers?filter[is_active]=1');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Infobip')
        ->assertJsonPath('data.0.is_active', true);
});

it('sorts routers by name', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Router::factory()->create(['name' => 'Zeta']);
    Router::factory()->create(['name' => 'Alpha']);

    $response = $this->getJson('/api/routers?sort=name');

    $response->assertOk()
        ->assertJsonPath('data.0.name', 'Alpha')
        ->assertJsonPath('data.1.name', 'Zeta');
});

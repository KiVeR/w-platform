<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Partner;
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
                'partners_count',
                'campaigns_count',
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

it('returns partner and campaign counts on index', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $router = Router::factory()->create(['name' => 'Counted']);
    Partner::factory()->count(2)->create(['router_id' => $router->id]);
    Campaign::factory()->count(3)->create(['router_id' => $router->id]);

    $response = $this->getJson('/api/routers?filter[name]=Counted');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.partners_count', 2)
        ->assertJsonPath('data.0.campaigns_count', 3);
});

it('allows admin to create a router', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->postJson('/api/routers', [
        'name' => 'Highconnexion',
        'external_id' => 3,
        'num_stop' => '36173',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Highconnexion')
        ->assertJsonPath('data.external_id', 3)
        ->assertJsonPath('data.num_stop', '36173')
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('routers', [
        'name' => 'Highconnexion',
        'external_id' => 3,
        'num_stop' => '36173',
        'is_active' => true,
    ]);
});

it('validates router payload on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Router::factory()->create(['name' => 'Taken']);

    $this->postJson('/api/routers', [
        'name' => 'Taken',
        'external_id' => 'abc',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'external_id']);
});

it('denies employee from creating a router', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->postJson('/api/routers', [
        'name' => 'Denied',
    ])->assertForbidden();
});

it('allows admin to update a router', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $router = Router::factory()->create([
        'name' => 'Infobip',
        'external_id' => 2,
        'num_stop' => '36111',
        'is_active' => true,
    ]);

    $response = $this->putJson("/api/routers/{$router->id}", [
        'name' => 'Infobip Updated',
        'external_id' => 22,
        'is_active' => false,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Infobip Updated')
        ->assertJsonPath('data.external_id', 22)
        ->assertJsonPath('data.is_active', false);

    $this->assertDatabaseHas('routers', [
        'id' => $router->id,
        'name' => 'Infobip Updated',
        'external_id' => 22,
        'is_active' => false,
    ]);
});

it('denies employee from updating a router', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $router = Router::factory()->create(['name' => 'Infobip']);

    $this->putJson("/api/routers/{$router->id}", [
        'name' => 'Blocked',
    ])->assertForbidden();
});

it('allows admin to delete a router', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $router = Router::factory()->create(['name' => 'Disposable']);

    $this->deleteJson("/api/routers/{$router->id}")
        ->assertOk()
        ->assertJsonPath('message', 'Router deleted.');

    $this->assertDatabaseMissing('routers', ['id' => $router->id]);
});

it('blocks delete when a partner uses the router', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $router = Router::factory()->create(['name' => 'Partner-bound']);
    Partner::factory()->create(['router_id' => $router->id]);

    $this->deleteJson("/api/routers/{$router->id}")
        ->assertStatus(409)
        ->assertJsonPath('message', 'Router is in use. Disable it instead.');

    $this->assertDatabaseHas('routers', ['id' => $router->id]);
});

it('blocks delete when a campaign uses the router', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $router = Router::factory()->create(['name' => 'Campaign-bound']);
    Campaign::factory()->create(['router_id' => $router->id]);

    $this->deleteJson("/api/routers/{$router->id}")
        ->assertStatus(409)
        ->assertJsonPath('message', 'Router is in use. Disable it instead.');

    $this->assertDatabaseHas('routers', ['id' => $router->id]);
});

it('denies employee from deleting a router', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $router = Router::factory()->create(['name' => 'Protected']);

    $this->deleteJson("/api/routers/{$router->id}")->assertForbidden();
});

<?php

declare(strict_types=1);

use App\Models\Interest;
use App\Models\InterestGroup;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('returns interest groups as hierarchical tree for admin', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $parent = InterestGroup::factory()->create(['label' => 'Habitat']);
    $child = InterestGroup::factory()->forParent($parent)->create(['label' => 'Maison']);
    Interest::factory()->count(2)->forGroup($child)->create();

    $response = $this->getJson('/api/interest-groups');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.label', 'Habitat')
        ->assertJsonPath('data.0.children.0.label', 'Maison')
        ->assertJsonCount(2, 'data.0.children.0.interests');
});

it('filters hidden groups for non-admin partner', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $visible = InterestGroup::factory()->create(['label' => 'Visible']);
    $hidden = InterestGroup::factory()->create(['label' => 'Hidden']);
    $hidden->hiddenForPartners()->attach($partner->id);

    $response = $this->getJson('/api/interest-groups');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.label', 'Visible');
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/interest-groups')->assertUnauthorized();
});

it('returns interest resource with correct structure', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $group = InterestGroup::factory()->create();
    $interest = Interest::factory()->forGroup($group)->create([
        'wellpack_id' => 42,
        'label' => 'Bricolage',
        'type' => 'interest',
    ]);

    $response = $this->getJson('/api/interest-groups');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['id', 'label', 'description', 'is_active', 'children', 'interests' => [['id', 'wellpack_id', 'label', 'type']]]]]);
});

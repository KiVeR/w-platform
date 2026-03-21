<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('POST /campaigns returns X-Deprecated header', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/campaigns', [
        'partner_id' => $partner->id,
        'type'       => 'prospection',
        'channel'    => 'sms',
        'name'       => 'Test Deprecated',
    ]);

    $response->assertCreated();
    expect($response->headers->get('X-Deprecated'))->toBe('true');
    expect($response->headers->get('Deprecation'))->toBe('true');
    expect($response->headers->get('Sunset'))->toBe('2026-09-01');
});

it('POST /campaigns still creates the campaign (route remains functional)', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/campaigns', [
        'partner_id' => $partner->id,
        'type'       => 'prospection',
        'channel'    => 'sms',
        'name'       => 'Functional Campaign',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Functional Campaign');
});

it('GET /campaigns does not include X-Deprecated header', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->getJson('/api/campaigns');

    $response->assertOk();
    expect($response->headers->has('X-Deprecated'))->toBeFalse();
});

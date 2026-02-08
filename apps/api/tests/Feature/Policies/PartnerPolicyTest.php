<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('allows admin to view any partners', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('viewAny', Partner::class))->toBeTrue();
});

it('allows partner role to view any partners', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('viewAny', Partner::class))->toBeTrue();
});

it('denies employee to view any partners', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    expect($user->can('viewAny', Partner::class))->toBeFalse();
});

it('allows admin to view any partner', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $partner = Partner::factory()->create();

    expect($admin->can('view', $partner))->toBeTrue();
});

it('allows user to view own partner', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('view', $partner))->toBeTrue();
});

it('denies user from viewing another partner', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');

    expect($user->can('view', $partner2))->toBeFalse();
});

it('allows only admin to create partners', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $partnerUser = User::factory()->create();
    $partnerUser->assignRole('partner');

    expect($admin->can('create', Partner::class))->toBeTrue()
        ->and($partnerUser->can('create', Partner::class))->toBeFalse();
});

it('allows only admin to update partners', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $partner = Partner::factory()->create();

    $partnerUser = User::factory()->forPartner($partner)->create();
    $partnerUser->assignRole('partner');

    expect($admin->can('update', $partner))->toBeTrue()
        ->and($partnerUser->can('update', $partner))->toBeFalse();
});

it('allows only admin to delete partners', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $partner = Partner::factory()->create();

    $partnerUser = User::factory()->forPartner($partner)->create();
    $partnerUser->assignRole('partner');

    expect($admin->can('delete', $partner))->toBeTrue()
        ->and($partnerUser->can('delete', $partner))->toBeFalse();
});

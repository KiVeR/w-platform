<?php

declare(strict_types=1);

use App\Models\Demande;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- viewAny ---

it('allows admin to view any demandes', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('viewAny', Demande::class))->toBeTrue();
});

it('allows partner to view any demandes', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('viewAny', Demande::class))->toBeTrue();
});

it('denies employee without permission to view any demandes', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    expect($user->can('viewAny', Demande::class))->toBeFalse();
});

// --- view ---

it('allows admin to view any demande', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $demande = Demande::factory()->create();

    expect($admin->can('view', $demande))->toBeTrue();
});

it('allows partner to view own demande', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($partner)->create();

    expect($user->can('view', $demande))->toBeTrue();
});

it('denies partner from viewing other partner demande', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($otherPartner)->create();

    expect($user->can('view', $demande))->toBeFalse();
});

// --- create ---

it('allows admin to create demandes', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('create', Demande::class))->toBeTrue();
});

it('denies partner from creating demandes without manage permission', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('create', Demande::class))->toBeFalse();
});

// --- update ---

it('allows admin to update any demande', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $demande = Demande::factory()->create();

    expect($admin->can('update', $demande))->toBeTrue();
});

it('allows partner to update own demande', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($partner)->create();

    expect($user->can('update', $demande))->toBeTrue();
});

it('denies partner from updating other partner demande', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($otherPartner)->create();

    expect($user->can('update', $demande))->toBeFalse();
});

// --- delete ---

it('allows admin to delete any demande', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $demande = Demande::factory()->create();

    expect($admin->can('delete', $demande))->toBeTrue();
});

it('allows partner to delete own demande', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($partner)->create();

    expect($user->can('delete', $demande))->toBeTrue();
});

it('denies partner from deleting other partner demande', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($otherPartner)->create();

    expect($user->can('delete', $demande))->toBeFalse();
});

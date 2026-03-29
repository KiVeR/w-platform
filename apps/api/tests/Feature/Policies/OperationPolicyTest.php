<?php

declare(strict_types=1);

use App\Enums\LifecycleStatus;
use App\Models\Demande;
use App\Models\Operation;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- viewAny ---

it('allows admin to view any operations', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('viewAny', Operation::class))->toBeTrue();
});

it('allows partner to view any operations', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('viewAny', Operation::class))->toBeTrue();
});

it('denies employee without permission to view any operations', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    expect($user->can('viewAny', Operation::class))->toBeFalse();
});

// --- view ---

it('allows admin to view any operation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $operation = Operation::factory()->loc()->create();

    expect($admin->can('view', $operation))->toBeTrue();
});

it('allows partner to view own operation', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($partner)->create();
    $operation = Operation::factory()->loc()->forDemande($demande)->create();

    expect($user->can('view', $operation))->toBeTrue();
});

it('denies partner from viewing other partner operation', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($otherPartner)->create();
    $operation = Operation::factory()->loc()->forDemande($demande)->create();

    expect($user->can('view', $operation))->toBeFalse();
});

// --- create ---

it('allows admin to create operations', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('create', Operation::class))->toBeTrue();
});

it('denies partner from creating operations', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('create', Operation::class))->toBeFalse();
});

// --- update ---

it('allows admin to update any operation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $operation = Operation::factory()->loc()->create();

    expect($admin->can('update', $operation))->toBeTrue();
});

it('allows partner to update own operation', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($partner)->create();
    $operation = Operation::factory()->loc()->forDemande($demande)->create();

    expect($user->can('update', $operation))->toBeTrue();
});

it('denies partner from updating other partner operation', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($otherPartner)->create();
    $operation = Operation::factory()->loc()->forDemande($demande)->create();

    expect($user->can('update', $operation))->toBeFalse();
});

// --- delete ---

it('allows admin to delete draft operation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $operation = Operation::factory()->loc()->create([
        'lifecycle_status' => LifecycleStatus::DRAFT,
    ]);

    expect($admin->can('delete', $operation))->toBeTrue();
});

it('denies admin from deleting non-draft operation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $operation = Operation::factory()->loc()->create([
        'lifecycle_status' => LifecycleStatus::PROCESSING,
    ]);

    expect($admin->can('delete', $operation))->toBeFalse();
});

it('denies partner from deleting operations', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $demande = Demande::factory()->forPartner($partner)->create();
    $operation = Operation::factory()->loc()->forDemande($demande)->create([
        'lifecycle_status' => LifecycleStatus::DRAFT,
    ]);

    expect($user->can('delete', $operation))->toBeFalse();
});

// --- transition ---

it('allows admin to transition operations', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $operation = Operation::factory()->loc()->create();

    expect($admin->can('transition', $operation))->toBeTrue();
});

it('denies partner from transitioning operations without permission', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $operation = Operation::factory()->loc()->create();

    expect($user->can('transition', $operation))->toBeFalse();
});

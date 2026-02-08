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

it('allows admin to view any users', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('viewAny', User::class))->toBeTrue();
});

it('allows partner role to view any users', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('viewAny', User::class))->toBeTrue();
});

it('denies employee to view any users', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    expect($user->can('viewAny', User::class))->toBeFalse();
});

it('allows admin to view any user', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $target = User::factory()->create();

    expect($admin->can('view', $target))->toBeTrue();
});

it('allows user to view user in same partner', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $target = User::factory()->forPartner($partner)->create();

    expect($user->can('view', $target))->toBeTrue();
});

it('denies user from viewing user in another partner', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    $target = User::factory()->forPartner($partner2)->create();

    expect($user->can('view', $target))->toBeFalse();
});

it('allows only admin to create users', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $partnerUser = User::factory()->create();
    $partnerUser->assignRole('partner');

    expect($admin->can('create', User::class))->toBeTrue()
        ->and($partnerUser->can('create', User::class))->toBeFalse();
});

it('allows only admin to update users', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $target = User::factory()->create();

    $partnerUser = User::factory()->create();
    $partnerUser->assignRole('partner');

    expect($admin->can('update', $target))->toBeTrue()
        ->and($partnerUser->can('update', $target))->toBeFalse();
});

it('allows admin to delete other users', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $target = User::factory()->create();

    expect($admin->can('delete', $target))->toBeTrue();
});

it('denies admin from deleting self', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('delete', $admin))->toBeFalse();
});

it('denies non-admin from deleting users', function (): void {
    $partnerUser = User::factory()->create();
    $partnerUser->assignRole('partner');
    $target = User::factory()->create();

    expect($partnerUser->can('delete', $target))->toBeFalse();
});

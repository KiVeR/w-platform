<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\Shop;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('allows admin to view any shops', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('viewAny', Shop::class))->toBeTrue();
});

it('allows partner role to view any shops', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('viewAny', Shop::class))->toBeTrue();
});

it('allows merchant role to view any shops', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');

    expect($user->can('viewAny', Shop::class))->toBeTrue();
});

it('denies employee to view any shops', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    expect($user->can('viewAny', Shop::class))->toBeFalse();
});

it('allows admin to view any shop', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $shop = Shop::factory()->create();

    expect($admin->can('view', $shop))->toBeTrue();
});

it('allows user to view own partner shop', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $shop = Shop::factory()->forPartner($partner)->create();

    expect($user->can('view', $shop))->toBeTrue();
});

it('denies user from viewing another partner shop', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    $shop = Shop::factory()->forPartner($partner2)->create();

    expect($user->can('view', $shop))->toBeFalse();
});

it('allows admin to create shops', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('create', Shop::class))->toBeTrue();
});

it('allows partner user to create shops', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('create', Shop::class))->toBeTrue();
});

it('denies user without partner to create shops', function (): void {
    $user = User::factory()->create();
    $user->assignRole('merchant');

    expect($user->can('create', Shop::class))->toBeFalse();
});

it('allows user to update own partner shop', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $shop = Shop::factory()->forPartner($partner)->create();

    expect($user->can('update', $shop))->toBeTrue();
});

it('denies user from updating another partner shop', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    $shop = Shop::factory()->forPartner($partner2)->create();

    expect($user->can('update', $shop))->toBeFalse();
});

it('allows user to delete own partner shop', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $shop = Shop::factory()->forPartner($partner)->create();

    expect($user->can('delete', $shop))->toBeTrue();
});

it('denies user from deleting another partner shop', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    $shop = Shop::factory()->forPartner($partner2)->create();

    expect($user->can('delete', $shop))->toBeFalse();
});

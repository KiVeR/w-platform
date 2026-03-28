<?php

declare(strict_types=1);

use App\Models\AIContent;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- viewAny ---

it('allows admin to view any ai contents', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('viewAny', AIContent::class))->toBeTrue();
});

it('allows partner to view any ai contents', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('viewAny', AIContent::class))->toBeTrue();
});

it('denies employee without permission to view any ai contents', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    expect($user->can('viewAny', AIContent::class))->toBeFalse();
});

// --- view ---

it('allows admin to view any ai content', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $aiContent = AIContent::factory()->create();

    expect($admin->can('view', $aiContent))->toBeTrue();
});

it('allows partner to view own ai content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $aiContent = AIContent::factory()->forPartner($partner)->create();

    expect($user->can('view', $aiContent))->toBeTrue();
});

it('denies partner from viewing other partner ai content', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $aiContent = AIContent::factory()->forPartner($otherPartner)->create();

    expect($user->can('view', $aiContent))->toBeFalse();
});

// --- create ---

it('allows admin to create ai contents', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('create', AIContent::class))->toBeTrue();
});

it('allows partner with manage permission to create ai contents', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('create', AIContent::class))->toBeTrue();
});

it('denies internal user without partner to create ai contents', function (): void {
    $user = User::factory()->create();
    $user->givePermissionTo('manage ai-contents');

    // Internal user (no partner_id) with manage permission but no admin role
    expect($user->can('create', AIContent::class))->toBeFalse();
});

// --- update ---

it('allows admin to update any ai content', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $aiContent = AIContent::factory()->create();

    expect($admin->can('update', $aiContent))->toBeTrue();
});

it('allows partner to update own ai content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $aiContent = AIContent::factory()->forPartner($partner)->create();

    expect($user->can('update', $aiContent))->toBeTrue();
});

it('denies partner from updating other partner ai content', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $aiContent = AIContent::factory()->forPartner($otherPartner)->create();

    expect($user->can('update', $aiContent))->toBeFalse();
});

// --- delete ---

it('allows admin to delete any ai content', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $aiContent = AIContent::factory()->create();

    expect($admin->can('delete', $aiContent))->toBeTrue();
});

it('allows partner to delete own ai content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $aiContent = AIContent::factory()->forPartner($partner)->create();

    expect($user->can('delete', $aiContent))->toBeTrue();
});

it('denies partner from deleting other partner ai content', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $aiContent = AIContent::factory()->forPartner($otherPartner)->create();

    expect($user->can('delete', $aiContent))->toBeFalse();
});

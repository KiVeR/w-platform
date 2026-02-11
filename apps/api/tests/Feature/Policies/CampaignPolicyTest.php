<?php

declare(strict_types=1);

use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- viewAny ---

it('allows admin to viewAny campaigns', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('viewAny', Campaign::class))->toBeTrue();
});

it('allows partner role to viewAny campaigns', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('viewAny', Campaign::class))->toBeTrue();
});

it('allows merchant role to viewAny campaigns', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');

    expect($user->can('viewAny', Campaign::class))->toBeTrue();
});

it('denies employee to viewAny campaigns', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    expect($user->can('viewAny', Campaign::class))->toBeFalse();
});

// --- view ---

it('allows admin to view any campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $campaign = Campaign::factory()->create();

    expect($admin->can('view', $campaign))->toBeTrue();
});

it('allows user to view own partner campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $campaign = Campaign::factory()->forPartner($partner)->create();

    expect($user->can('view', $campaign))->toBeTrue();
});

it('denies user from viewing another partner campaign', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    $campaign = Campaign::factory()->forPartner($partner2)->create();

    expect($user->can('view', $campaign))->toBeFalse();
});

// --- create ---

it('allows admin to create campaigns', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('create', Campaign::class))->toBeTrue();
});

it('allows partner user to create campaigns', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('create', Campaign::class))->toBeTrue();
});

it('denies user without partner to create campaigns', function (): void {
    $user = User::factory()->create();
    $user->assignRole('merchant');

    expect($user->can('create', Campaign::class))->toBeFalse();
});

// --- update ---

it('allows user to update own partner campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $campaign = Campaign::factory()->forPartner($partner)->create();

    expect($user->can('update', $campaign))->toBeTrue();
});

it('denies user from updating another partner campaign', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    $campaign = Campaign::factory()->forPartner($partner2)->create();

    expect($user->can('update', $campaign))->toBeFalse();
});

it('denies update on sent campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $campaign = Campaign::factory()->sent()->create();

    expect($admin->can('update', $campaign))->toBeFalse();
});

it('denies update on sending campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $campaign = Campaign::factory()->create(['status' => CampaignStatus::SENDING]);

    expect($admin->can('update', $campaign))->toBeFalse();
});

// --- delete ---

it('denies delete on sending campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $campaign = Campaign::factory()->create(['status' => CampaignStatus::SENDING]);

    expect($admin->can('delete', $campaign))->toBeFalse();
});

// --- send ---

it('allows user to send own partner campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $campaign = Campaign::factory()->forPartner($partner)->create();

    expect($user->can('send', $campaign))->toBeTrue();
});

it('denies send on sent campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $campaign = Campaign::factory()->sent()->create();

    expect($admin->can('send', $campaign))->toBeFalse();
});

it('denies send on sending campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $campaign = Campaign::factory()->create(['status' => CampaignStatus::SENDING]);

    expect($admin->can('send', $campaign))->toBeFalse();
});

// --- cancel ---

it('allows user to cancel own partner campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $campaign = Campaign::factory()->forPartner($partner)->create();

    expect($user->can('cancel', $campaign))->toBeTrue();
});

it('denies cancel on sent campaign', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $campaign = Campaign::factory()->sent()->create();

    expect($admin->can('cancel', $campaign))->toBeFalse();
});

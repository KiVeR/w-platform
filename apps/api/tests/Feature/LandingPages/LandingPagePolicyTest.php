<?php

declare(strict_types=1);

use App\Models\LandingPage;
use App\Models\Partner;
use App\Models\User;
use App\Policies\LandingPagePolicy;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->policy = new LandingPagePolicy;
});

it('allows admin to viewAny', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($this->policy->viewAny($admin))->toBeTrue();
});

it('allows admin to view any landing page', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $lp = LandingPage::factory()->create();

    expect($this->policy->view($admin, $lp))->toBeTrue();
});

it('allows admin to create', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($this->policy->create($admin))->toBeTrue();
});

it('allows admin to update any landing page', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $lp = LandingPage::factory()->create();

    expect($this->policy->update($admin, $lp))->toBeTrue();
});

it('allows admin to delete any landing page', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $lp = LandingPage::factory()->create();

    expect($this->policy->delete($admin, $lp))->toBeTrue();
});

it('allows partner to viewAny', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($this->policy->viewAny($user))->toBeTrue();
});

it('allows partner to view own landing page', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $lp = LandingPage::factory()->forPartner($partner)->create();

    expect($this->policy->view($user, $lp))->toBeTrue();
});

it('denies partner from viewing other partner landing page', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');

    $lp = LandingPage::factory()->forPartner($partner2)->create();

    expect($this->policy->view($user, $lp))->toBeFalse();
});

it('allows partner to create with permission', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($this->policy->create($user))->toBeTrue();
});

it('allows merchant to view and manage landing pages', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');

    $lp = LandingPage::factory()->forPartner($partner)->create();

    expect($this->policy->viewAny($user))->toBeTrue()
        ->and($this->policy->view($user, $lp))->toBeTrue()
        ->and($this->policy->create($user))->toBeTrue()
        ->and($this->policy->update($user, $lp))->toBeTrue()
        ->and($this->policy->delete($user, $lp))->toBeTrue();
});

it('denies employee from all landing page actions', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    $lp = LandingPage::factory()->create();

    expect($this->policy->viewAny($user))->toBeFalse()
        ->and($this->policy->view($user, $lp))->toBeFalse()
        ->and($this->policy->create($user))->toBeFalse()
        ->and($this->policy->update($user, $lp))->toBeFalse()
        ->and($this->policy->delete($user, $lp))->toBeFalse();
});

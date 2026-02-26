<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\TargetingTemplate;
use App\Models\User;
use App\Policies\TargetingTemplatePolicy;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->policy = new TargetingTemplatePolicy;
});

it('allows admin to viewAny', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($this->policy->viewAny($admin))->toBeTrue();
});

it('allows admin to view any template', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $template = TargetingTemplate::factory()->create();

    expect($this->policy->view($admin, $template))->toBeTrue();
});

it('allows admin to create', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($this->policy->create($admin))->toBeTrue();
});

it('allows admin to update any template', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $template = TargetingTemplate::factory()->create();

    expect($this->policy->update($admin, $template))->toBeTrue();
});

it('allows admin to delete any template', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $template = TargetingTemplate::factory()->create();

    expect($this->policy->delete($admin, $template))->toBeTrue();
});

it('allows partner to viewAny', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($this->policy->viewAny($user))->toBeTrue();
});

it('allows partner to view own template', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $template = TargetingTemplate::factory()->forPartner($partner)->create();

    expect($this->policy->view($user, $template))->toBeTrue();
});

it('allows partner to view presets', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $preset = TargetingTemplate::factory()->preset()->create();

    expect($this->policy->view($user, $preset))->toBeTrue();
});

it('denies partner from viewing other partner template', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');

    $template = TargetingTemplate::factory()->forPartner($partner2)->create();

    expect($this->policy->view($user, $template))->toBeFalse();
});

it('allows partner to create with permission', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($this->policy->create($user))->toBeTrue();
});

it('allows partner to update own template', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $template = TargetingTemplate::factory()->forPartner($partner)->create();

    expect($this->policy->update($user, $template))->toBeTrue();
});

it('denies partner from updating other partner template', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');

    $template = TargetingTemplate::factory()->forPartner($partner2)->create();

    expect($this->policy->update($user, $template))->toBeFalse();
});

it('allows partner to delete own template', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $template = TargetingTemplate::factory()->forPartner($partner)->create();

    expect($this->policy->delete($user, $template))->toBeTrue();
});

it('denies partner from deleting other partner template', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');

    $template = TargetingTemplate::factory()->forPartner($partner2)->create();

    expect($this->policy->delete($user, $template))->toBeFalse();
});

it('allows merchant to view and manage templates', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');

    $template = TargetingTemplate::factory()->forPartner($partner)->create();

    expect($this->policy->viewAny($user))->toBeTrue()
        ->and($this->policy->view($user, $template))->toBeTrue()
        ->and($this->policy->create($user))->toBeTrue()
        ->and($this->policy->update($user, $template))->toBeTrue()
        ->and($this->policy->delete($user, $template))->toBeTrue();
});

it('denies employee from all template actions', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    $template = TargetingTemplate::factory()->create();

    expect($this->policy->viewAny($user))->toBeFalse()
        ->and($this->policy->view($user, $template))->toBeFalse()
        ->and($this->policy->create($user))->toBeFalse()
        ->and($this->policy->update($user, $template))->toBeFalse()
        ->and($this->policy->delete($user, $template))->toBeFalse();
});

<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

function actingAsAdmin(): User
{
    test()->seed(RolesAndPermissionsSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    return $user;
}

function actingAsPartner(?Partner $partner = null): User
{
    test()->seed(RolesAndPermissionsSeeder::class);

    $partner ??= Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    return $user;
}

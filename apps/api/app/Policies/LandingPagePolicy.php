<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\LandingPage;
use App\Models\User;

class LandingPagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view landing-pages', 'api');
    }

    public function view(User $user, LandingPage $landingPage): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $landingPage->partner_id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin')
            || ($user->hasPermissionTo('manage landing-pages', 'api') && $user->partner_id !== null);
    }

    public function update(User $user, LandingPage $landingPage): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $landingPage->partner_id;
    }

    public function delete(User $user, LandingPage $landingPage): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $landingPage->partner_id;
    }
}

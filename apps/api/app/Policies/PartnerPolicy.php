<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Partner;
use App\Models\User;

class PartnerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view partners', 'api');
    }

    public function view(User $user, Partner $partner): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $partner->id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Partner $partner): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Partner $partner): bool
    {
        return $user->hasRole('admin');
    }
}

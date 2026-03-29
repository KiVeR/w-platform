<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Partner;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view users', 'api');
    }

    public function view(User $user, User $target): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->partner_id !== null && $user->partner_id === $target->partner_id) {
            return true;
        }

        if ($user->hasRole('adv') && $target->partner_id !== null) {
            return Partner::where('id', $target->partner_id)
                ->where('adv_id', $user->id)
                ->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, User $target): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, User $target): bool
    {
        return $user->hasRole('admin') && $user->id !== $target->id;
    }
}

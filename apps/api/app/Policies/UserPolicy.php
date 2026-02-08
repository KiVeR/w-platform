<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view users', 'api');
    }

    public function view(User $user, User $target): bool
    {
        return $user->hasRole('admin')
            || ($user->partner_id !== null && $user->partner_id === $target->partner_id);
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

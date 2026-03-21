<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\LifecycleStatus;
use App\Models\Operation;
use App\Models\User;

class OperationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view operations', 'api');
    }

    public function view(User $user, Operation $operation): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $operation->demande?->partner_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage operations', 'api');
    }

    public function update(User $user, Operation $operation): bool
    {
        return $user->hasPermissionTo('manage operations', 'api')
            && ($user->hasRole('admin') || $user->partner_id === $operation->demande?->partner_id);
    }

    public function delete(User $user, Operation $operation): bool
    {
        if ($operation->lifecycle_status !== LifecycleStatus::DRAFT) {
            return false;
        }

        return $user->hasRole('admin');
    }

    public function transition(User $user, Operation $operation): bool
    {
        return $user->hasPermissionTo('transition operations', 'api')
            && ($user->hasRole('admin') || $user->partner_id === $operation->demande?->partner_id);
    }
}

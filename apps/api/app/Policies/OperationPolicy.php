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
        // Internal users (no partner_id) with permission can view all operations
        if ($user->partner_id === null && $user->can('view operations')) {
            return true;
        }

        // Partners can only view their own
        return $operation->demande->partner_id === $user->partner_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage operations', 'api');
    }

    public function update(User $user, Operation $operation): bool
    {
        if ($user->partner_id === null && $user->can('manage operations')) {
            return true;
        }

        return $operation->demande->partner_id === $user->partner_id;
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
        return $user->can('transition operations');
    }
}

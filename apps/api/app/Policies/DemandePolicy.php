<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Demande;
use App\Models\User;

class DemandePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view demandes', 'api');
    }

    public function view(User $user, Demande $demande): bool
    {
        // Internal users (no partner_id) with permission can view all demandes
        if ($user->partner_id === null && $user->can('view demandes')) {
            return true;
        }

        // Partners can only view their own
        return $user->partner_id === $demande->partner_id;
    }

    public function create(User $user): bool
    {
        return $user->can('manage demandes');
    }

    public function update(User $user, Demande $demande): bool
    {
        if ($user->partner_id === null && $user->can('manage demandes')) {
            return true;
        }

        return $user->partner_id === $demande->partner_id;
    }

    public function delete(User $user, Demande $demande): bool
    {
        if ($user->partner_id === null && $user->can('manage demandes')) {
            return true;
        }

        return $user->partner_id === $demande->partner_id;
    }
}

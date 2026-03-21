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
        return $user->hasRole('admin')
            || $user->partner_id === $demande->partner_id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin')
            || ($user->hasPermissionTo('manage demandes', 'api') && $user->partner_id !== null);
    }

    public function update(User $user, Demande $demande): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $demande->partner_id;
    }

    public function delete(User $user, Demande $demande): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $demande->partner_id;
    }
}

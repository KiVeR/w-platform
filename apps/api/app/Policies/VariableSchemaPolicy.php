<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Models\VariableSchema;

class VariableSchemaPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view variable-schemas', 'api');
    }

    public function view(User $user, VariableSchema $variableSchema): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $variableSchema->partner_id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin')
            || ($user->hasPermissionTo('manage variable-schemas', 'api') && $user->partner_id !== null);
    }

    public function update(User $user, VariableSchema $variableSchema): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $variableSchema->partner_id;
    }

    public function delete(User $user, VariableSchema $variableSchema): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $variableSchema->partner_id;
    }
}

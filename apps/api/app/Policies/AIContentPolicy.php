<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\AIContent;
use App\Models\User;

class AIContentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view ai-contents', 'api');
    }

    public function view(User $user, AIContent $aiContent): bool
    {
        return $user->hasRole('admin') || $user->partner_id === $aiContent->partner_id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin') || ($user->hasPermissionTo('manage ai-contents', 'api') && $user->partner_id !== null);
    }

    public function update(User $user, AIContent $aiContent): bool
    {
        return $user->hasRole('admin') || $user->partner_id === $aiContent->partner_id;
    }

    public function delete(User $user, AIContent $aiContent): bool
    {
        return $user->hasRole('admin') || $user->partner_id === $aiContent->partner_id;
    }
}

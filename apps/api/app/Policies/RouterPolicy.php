<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Router;
use App\Models\User;

class RouterPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view routers', 'api');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage routers', 'api');
    }

    public function update(User $user, Router $router): bool
    {
        return $user->hasPermissionTo('manage routers', 'api');
    }

    public function delete(User $user, Router $router): bool
    {
        return $user->hasPermissionTo('manage routers', 'api');
    }
}

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
}

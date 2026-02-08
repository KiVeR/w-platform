<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Shop;
use App\Models\User;

class ShopPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view shops', 'api');
    }

    public function view(User $user, Shop $shop): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $shop->partner_id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin')
            || ($user->hasPermissionTo('manage shops', 'api') && $user->partner_id !== null);
    }

    public function update(User $user, Shop $shop): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $shop->partner_id;
    }

    public function delete(User $user, Shop $shop): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $shop->partner_id;
    }
}

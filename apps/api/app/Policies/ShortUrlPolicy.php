<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ShortUrl;
use App\Models\User;

class ShortUrlPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view short-urls', 'api');
    }

    public function view(User $user, ShortUrl $shortUrl): bool
    {
        return $user->hasPermissionTo('view short-urls', 'api');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage short-urls', 'api');
    }

    public function update(User $user, ShortUrl $shortUrl): bool
    {
        return $user->hasPermissionTo('manage short-urls', 'api');
    }

    public function delete(User $user, ShortUrl|null $shortUrl = null): bool
    {
        return $user->hasPermissionTo('manage short-urls', 'api');
    }
}

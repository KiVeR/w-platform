<?php

declare(strict_types=1);

namespace App\Http\Concerns;

use App\Models\User;

trait AuthenticatedUser
{
    protected function currentUser(): User
    {
        /** @var User $user */
        $user = auth()->user();

        return $user;
    }
}

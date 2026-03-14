<?php

declare(strict_types=1);

namespace App\Broadcasting;

use App\Models\User;

class CampaignChannel
{
    public function join(User $user): bool
    {
        return $user->hasPermissionTo('view campaigns', 'api');
    }
}

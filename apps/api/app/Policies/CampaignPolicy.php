<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\User;

class CampaignPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view campaigns', 'api');
    }

    public function view(User $user, Campaign $campaign): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $campaign->partner_id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin')
            || ($user->hasPermissionTo('manage campaigns', 'api') && $user->partner_id !== null);
    }

    public function update(User $user, Campaign $campaign): bool
    {
        if (in_array($campaign->status, [CampaignStatus::SENT, CampaignStatus::SENDING, CampaignStatus::FAILED], true)) {
            return false;
        }

        return $user->hasRole('admin')
            || $user->partner_id === $campaign->partner_id;
    }

    public function delete(User $user, Campaign $campaign): bool
    {
        if ($campaign->status === CampaignStatus::SENDING) {
            return false;
        }

        return $user->hasRole('admin')
            || $user->partner_id === $campaign->partner_id;
    }

    public function send(User $user, Campaign $campaign): bool
    {
        if (in_array($campaign->status, [CampaignStatus::SENT, CampaignStatus::SENDING, CampaignStatus::FAILED], true)) {
            return false;
        }

        return $user->hasRole('admin')
            || $user->partner_id === $campaign->partner_id;
    }

    public function cancel(User $user, Campaign $campaign): bool
    {
        if ($campaign->status === CampaignStatus::SENT) {
            return false;
        }

        return $user->hasRole('admin')
            || $user->partner_id === $campaign->partner_id;
    }

    public function routing(User $user, Campaign $campaign): bool
    {
        return $user->hasRole('admin');
    }
}

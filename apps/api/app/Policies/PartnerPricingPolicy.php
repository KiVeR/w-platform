<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\PartnerPricing;
use App\Models\User;

class PartnerPricingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function view(User $user, PartnerPricing $partnerPricing): bool
    {
        return $user->hasRole('admin');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, PartnerPricing $partnerPricing): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, PartnerPricing $partnerPricing): bool
    {
        return $user->hasRole('admin');
    }
}

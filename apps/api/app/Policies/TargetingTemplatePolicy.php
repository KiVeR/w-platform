<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\TargetingTemplate;
use App\Models\User;

class TargetingTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view targeting-templates', 'api');
    }

    public function view(User $user, TargetingTemplate $template): bool
    {
        if ($template->is_preset) {
            return $user->hasPermissionTo('view targeting-templates', 'api');
        }

        return $user->hasRole('admin')
            || $user->partner_id === $template->partner_id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin')
            || ($user->hasPermissionTo('manage targeting-templates', 'api') && $user->partner_id !== null);
    }

    public function update(User $user, TargetingTemplate $template): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $template->partner_id;
    }

    public function delete(User $user, TargetingTemplate $template): bool
    {
        return $user->hasRole('admin')
            || $user->partner_id === $template->partner_id;
    }
}

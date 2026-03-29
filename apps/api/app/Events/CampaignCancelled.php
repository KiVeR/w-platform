<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Campaign;
use Illuminate\Foundation\Events\Dispatchable;

class CampaignCancelled
{
    use Dispatchable;

    public function __construct(
        public readonly Campaign $campaign,
    ) {}
}

<?php

declare(strict_types=1);

namespace App\Contracts;

use Illuminate\Support\Collection;

interface ReportsPullDriverInterface
{
    /**
     * Pull delivery reports for active campaigns from the provider API.
     * Returns a collection of raw report payloads.
     *
     * @param  Collection<int, array{batch_id: string, campaign_id: int}>  $activeCampaigns
     * @return Collection<int, array<string, mixed>>
     */
    public function pull(Collection $activeCampaigns): Collection;
}

<?php

declare(strict_types=1);

namespace App\Observers;

use App\Events\CampaignCreated;
use App\Events\CampaignRefresh;
use App\Events\CampaignUpdated;
use App\Models\Campaign;
use App\Services\SelfServiceOrchestrator;

class CampaignObserver
{
    /** @var list<string> */
    private const array SYNC_FIELDS = [
        'targeting',
        'volume_estimated',
        'unit_price',
        'total_price',
        'message',
        'sender',
        'scheduled_at',
    ];

    public function __construct(
        private readonly SelfServiceOrchestrator $orchestrator,
    ) {}

    public function created(Campaign $campaign): void
    {
        CampaignCreated::dispatch($campaign->id);

        $this->orchestrator->createFromCampaign($campaign);
    }

    public function updated(Campaign $campaign): void
    {
        CampaignUpdated::dispatch($campaign->id);

        if ($campaign->wasChanged('status')) {
            $this->orchestrator->handleStatusChange($campaign);
        }

        if ($this->hasDataFieldChanges($campaign)) {
            $this->orchestrator->syncOperationFromCampaign($campaign);
        }
    }

    public function deleted(Campaign $campaign): void
    {
        CampaignRefresh::dispatch();

        $this->orchestrator->handleCampaignDeleted($campaign);
    }

    private function hasDataFieldChanges(Campaign $campaign): bool
    {
        foreach (self::SYNC_FIELDS as $field) {
            if ($campaign->wasChanged($field)) {
                return true;
            }
        }

        return false;
    }
}

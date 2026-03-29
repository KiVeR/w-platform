<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CampaignResource;
use App\Models\Campaign;
use App\Services\CampaignRoutingService;

class CampaignRoutingController extends Controller
{
    public function __construct(
        private readonly CampaignRoutingService $routingService,
    ) {}

    public function start(Campaign $campaign): CampaignResource
    {
        return $this->executeAction($campaign, 'start');
    }

    public function pause(Campaign $campaign): CampaignResource
    {
        return $this->executeAction($campaign, 'pause');
    }

    public function cancel(Campaign $campaign): CampaignResource
    {
        return $this->executeAction($campaign, 'cancel');
    }

    private function executeAction(Campaign $campaign, string $action): CampaignResource
    {
        $this->authorize('routing', $campaign);

        $this->routingService->{$action}($campaign);

        return new CampaignResource($campaign->refresh());
    }
}

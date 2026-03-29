<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Exceptions\InvalidRoutingStateException;
use App\Http\Controllers\Controller;
use App\Http\Resources\CampaignResource;
use App\Models\Campaign;
use App\Services\CampaignRoutingService;
use Illuminate\Http\JsonResponse;

class CampaignRoutingController extends Controller
{
    public function __construct(
        private readonly CampaignRoutingService $routingService,
    ) {}

    public function start(Campaign $campaign): CampaignResource|JsonResponse
    {
        $this->authorize('routing', $campaign);

        try {
            $this->routingService->start($campaign);
        } catch (InvalidRoutingStateException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return new CampaignResource($campaign->refresh());
    }

    public function pause(Campaign $campaign): CampaignResource|JsonResponse
    {
        $this->authorize('routing', $campaign);

        try {
            $this->routingService->pause($campaign);
        } catch (InvalidRoutingStateException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return new CampaignResource($campaign->refresh());
    }

    public function cancel(Campaign $campaign): CampaignResource|JsonResponse
    {
        $this->authorize('routing', $campaign);

        try {
            $this->routingService->cancel($campaign);
        } catch (InvalidRoutingStateException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return new CampaignResource($campaign->refresh());
    }
}

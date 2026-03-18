<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CampaignLogResource;
use App\Models\Campaign;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CampaignLogsController extends Controller
{
    public function index(Campaign $campaign): AnonymousResourceCollection
    {
        $this->authorize('view', $campaign);

        return CampaignLogResource::collection(
            $campaign->campaignLogs()
                ->orderByDesc('created_at')
                ->get()
        );
    }
}

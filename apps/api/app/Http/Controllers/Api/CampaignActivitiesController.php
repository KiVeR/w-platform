<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LogActivityResource;
use App\Models\Campaign;
use App\Models\LogActivity;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CampaignActivitiesController extends Controller
{
    public function index(Campaign $campaign): AnonymousResourceCollection
    {
        $this->authorize('view', $campaign);

        $activities = LogActivity::query()
            ->where('model_type', Campaign::class)
            ->where('model_id', $campaign->id)
            ->orderByDesc('created_at')
            ->paginate(config('api.pagination.large'));

        return LogActivityResource::collection($activities);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SmsRouting\PullReportsJob;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;

class CampaignPullReportController extends Controller
{
    public function __invoke(Campaign $campaign): JsonResponse
    {
        $this->authorize('pullReport', $campaign);

        if ($campaign->routing_executed_at === null) {
            return response()->json([
                'message' => 'Campaign has not been routed yet.',
            ], 422);
        }

        PullReportsJob::dispatch();

        return response()->json([
            'message' => 'Report pull requested.',
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Broadcasting\CampaignChannel;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pusher\Pusher;
use Symfony\Component\HttpFoundation\Response;

class BroadcastingAuthController extends Controller
{
    public function __invoke(
        Request $request,
        CampaignChannel $campaignChannel,
        BroadcastManager $broadcastManager,
    ): JsonResponse {
        $validated = $request->validate([
            'socket_id' => ['required', 'string'],
            'channel_name' => ['required', 'string'],
        ]);

        /** @var User|null $user */
        $user = $request->user();

        if (! $user || $validated['channel_name'] !== 'private-campaign' || ! $campaignChannel->join($user)) {
            abort(Response::HTTP_FORBIDDEN);
        }

        /** @var Pusher $pusher */
        $pusher = $broadcastManager->connection('pusher')->getPusher();
        $response = $pusher->authorizeChannel($validated['channel_name'], $validated['socket_id']);

        /** @var array{auth: string} $payload */
        $payload = json_decode($response, true, flags: JSON_THROW_ON_ERROR);

        return new JsonResponse($payload);
    }
}

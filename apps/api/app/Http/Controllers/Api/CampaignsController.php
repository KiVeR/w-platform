<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Contracts\CampaignSenderInterface;
use App\Enums\CampaignStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Campaign\ScheduleCampaignRequest;
use App\Http\Requests\Campaign\StoreCampaignRequest;
use App\Http\Requests\Campaign\UpdateCampaignRequest;
use App\Http\Resources\CampaignResource;
use App\Models\Campaign;
use App\Models\User;
use App\Services\CampaignSending\StopSmsService;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\QueryBuilder;

class CampaignsController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Campaign::class);

        /** @var User $user */
        $user = auth()->user();

        $campaigns = QueryBuilder::for(Campaign::forUser($user))
            ->allowedFilters(['partner_id', 'type', 'status', 'channel'])
            ->allowedSorts(['name', 'scheduled_at', 'created_at'])
            ->allowedIncludes(['partner', 'creator', 'interestGroups'])
            ->paginate(15);

        return CampaignResource::collection($campaigns);
    }

    public function store(StoreCampaignRequest $request): CampaignResource
    {
        /** @var User $user */
        $user = auth()->user();

        $this->authorize('create', Campaign::class);

        $data = $request->validated();

        if (! $user->hasRole('admin')) {
            $data['partner_id'] = $user->partner_id;
        }

        $data['user_id'] = $user->id;

        $campaign = Campaign::create($data);

        return new CampaignResource($campaign->load('creator'));
    }

    public function show(Campaign $campaign): CampaignResource
    {
        $this->authorize('view', $campaign);

        $campaign = QueryBuilder::for(Campaign::where('id', $campaign->id))
            ->allowedIncludes(['partner', 'creator', 'interestGroups'])
            ->firstOrFail();

        return new CampaignResource($campaign);
    }

    public function update(UpdateCampaignRequest $request, Campaign $campaign): CampaignResource
    {
        $this->authorize('update', $campaign);

        $campaign->update($request->validated());

        return new CampaignResource($campaign->fresh());
    }

    public function destroy(Campaign $campaign): JsonResponse
    {
        $this->authorize('delete', $campaign);

        $campaign->delete();

        return new JsonResponse(['message' => 'Campaign deleted.']);
    }

    public function estimate(Campaign $campaign, PricingService $pricingService): CampaignResource
    {
        $this->authorize('update', $campaign);

        $volume = $campaign->getTargetingVolume();
        $useCi = $campaign->interestGroups()->exists();

        if ($volume > 0 && $campaign->partner_id !== null) {
            $estimate = $pricingService->calculate($campaign->partner_id, $volume, $useCi);
            $campaign->update([
                'volume_estimated' => $volume,
                'unit_price' => $estimate->unitPrice,
                'total_price' => $estimate->totalPrice,
                'sms_count' => $volume,
            ]);
        } else {
            $campaign->update([
                'volume_estimated' => 0,
                'unit_price' => null,
                'total_price' => null,
                'sms_count' => 0,
            ]);
        }

        return new CampaignResource($campaign->fresh());
    }

    public function schedule(ScheduleCampaignRequest $request, Campaign $campaign): CampaignResource|JsonResponse
    {
        $this->authorize('update', $campaign);

        if ($error = $this->ensureReadyToSend($campaign)) {
            return $error;
        }

        $campaign->update([
            'status' => CampaignStatus::SCHEDULED,
            'scheduled_at' => $request->validated('scheduled_at'),
        ]);

        return new CampaignResource($campaign->fresh());
    }

    public function send(Campaign $campaign, CampaignSenderInterface $sender, PricingService $pricingService): CampaignResource|JsonResponse
    {
        $this->authorize('send', $campaign);

        if ($error = $this->ensureReadyToSend($campaign)) {
            return $error;
        }

        if (! $campaign->volume_estimated || $campaign->volume_estimated <= 0) {
            return new JsonResponse(
                ['message' => 'Campaign must have a volume > 0.', 'errors' => ['volume_estimated' => ['Volume must be greater than 0.']]],
                422,
            );
        }

        $useCi = $campaign->interestGroups()->exists();
        /** @var int $partnerId */
        $partnerId = $campaign->partner_id;

        try {
            $estimate = $pricingService->calculate($partnerId, $campaign->volume_estimated, $useCi);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 422);
        }

        $result = $sender->send($campaign);

        if (! $result->success) {
            $campaign->update([
                'status' => CampaignStatus::FAILED,
                'error_message' => $result->error,
            ]);

            return new JsonResponse(['error' => $result->error], 502);
        }

        $campaign->update([
            'status' => CampaignStatus::SENDING,
            'unit_price' => $estimate->unitPrice,
            'total_price' => $estimate->totalPrice,
            'external_id' => $result->externalId,
        ]);

        return new CampaignResource($campaign->fresh());
    }

    public function cancel(Campaign $campaign): CampaignResource
    {
        $this->authorize('cancel', $campaign);

        $campaign->update([
            'status' => CampaignStatus::CANCELLED,
        ]);

        return new CampaignResource($campaign->fresh());
    }

    private function ensureReadyToSend(Campaign $campaign): ?JsonResponse
    {
        if (! $campaign->message || ! $campaign->sender) {
            return new JsonResponse(
                ['message' => 'Campaign must have a message and sender.', 'errors' => array_filter([
                    'message' => ! $campaign->message ? ['Message is required.'] : null,
                    'sender' => ! $campaign->sender ? ['Sender is required.'] : null,
                ])],
                422,
            );
        }

        $stopSmsService = app(StopSmsService::class);

        if ($stopSmsService->containsBlockedDomain($campaign->message)) {
            return new JsonResponse(
                ['message' => 'Message contains a blocked domain.', 'errors' => ['message' => ['The domain rsms.co is not allowed.']]],
                422,
            );
        }

        return null;
    }
}

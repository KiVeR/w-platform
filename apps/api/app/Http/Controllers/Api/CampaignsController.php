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

        $query = Campaign::query();

        if (! $user->hasRole('admin')) {
            $query->where('partner_id', $user->partner_id);
        }

        $campaigns = QueryBuilder::for($query)
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
        if ($campaign->status === CampaignStatus::SENT || $campaign->status === CampaignStatus::SENDING) {
            abort(403, 'Cannot update a campaign that is sent or sending.');
        }

        $this->authorize('update', $campaign);

        $campaign->update($request->validated());

        return new CampaignResource($campaign->fresh());
    }

    public function destroy(Campaign $campaign): JsonResponse
    {
        if ($campaign->status === CampaignStatus::SENDING) {
            abort(403, 'Cannot delete a campaign that is currently sending.');
        }

        $this->authorize('delete', $campaign);

        $campaign->delete();

        return new JsonResponse(['message' => 'Campaign deleted.']);
    }

    public function estimate(Campaign $campaign, PricingService $pricingService): CampaignResource
    {
        $this->authorize('update', $campaign);

        $volume = 0;
        $targeting = $campaign->targeting;

        if (is_array($targeting) && isset($targeting['geo']['postcodes']) && is_array($targeting['geo']['postcodes'])) {
            foreach ($targeting['geo']['postcodes'] as $postcode) {
                $volume += (int) ($postcode['volume'] ?? 0);
            }
        }

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

        if (! $campaign->message || ! $campaign->sender) {
            return new JsonResponse(
                ['message' => 'Campaign must have a message and sender before scheduling.', 'errors' => array_filter([
                    'message' => ! $campaign->message ? ['Message is required.'] : null,
                    'sender' => ! $campaign->sender ? ['Sender is required.'] : null,
                ])],
                422,
            );
        }

        $campaign->update([
            'status' => CampaignStatus::SCHEDULED,
            'scheduled_at' => $request->validated('scheduled_at'),
        ]);

        return new CampaignResource($campaign->fresh());
    }

    public function send(Campaign $campaign, CampaignSenderInterface $sender, PricingService $pricingService): CampaignResource|JsonResponse
    {
        $this->authorize('update', $campaign);

        if ($campaign->status === CampaignStatus::SENT || $campaign->status === CampaignStatus::SENDING) {
            abort(403, 'Campaign has already been sent or is sending.');
        }

        if (! $campaign->message || ! $campaign->sender) {
            return new JsonResponse(
                ['message' => 'Campaign must have a message and sender.', 'errors' => array_filter([
                    'message' => ! $campaign->message ? ['Message is required.'] : null,
                    'sender' => ! $campaign->sender ? ['Sender is required.'] : null,
                ])],
                422,
            );
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
        $estimate = $pricingService->calculate($partnerId, $campaign->volume_estimated, $useCi);

        $result = $sender->send($campaign);

        if (! $result->success) {
            return new JsonResponse(['error' => $result->error], 502);
        }

        $campaign->update([
            'status' => CampaignStatus::SENDING,
            'unit_price' => $estimate->unitPrice,
            'total_price' => $estimate->totalPrice,
            'trigger_campaign_uuid' => $result->externalId,
        ]);

        return new CampaignResource($campaign->fresh());
    }

    public function cancel(Campaign $campaign): CampaignResource
    {
        $this->authorize('update', $campaign);

        if ($campaign->status === CampaignStatus::SENT) {
            abort(403, 'Cannot cancel a campaign that has already been sent.');
        }

        $campaign->update([
            'status' => CampaignStatus::CANCELLED,
        ]);

        return new CampaignResource($campaign->fresh());
    }
}

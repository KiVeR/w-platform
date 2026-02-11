<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Contracts\CampaignSenderInterface;
use App\Contracts\CampaignStatsProviderInterface;
use App\DTOs\Targeting\TargetingInput;
use App\Enums\CampaignStatus;
use App\Exceptions\InsufficientCreditsException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Campaign\ScheduleCampaignRequest;
use App\Http\Requests\Campaign\StoreCampaignRequest;
use App\Http\Requests\Campaign\UpdateCampaignRequest;
use App\Http\Resources\CampaignResource;
use App\Http\Resources\CampaignStatsResource;
use App\Models\Campaign;
use App\Models\User;
use App\Services\CampaignExportService;
use App\Services\CampaignSending\StopSmsService;
use App\Services\CreditService;
use App\Services\PricingService;
use App\Services\Targeting\TargetingResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class CampaignsController extends Controller
{
    public function __construct(
        private readonly TargetingResolver $targetingResolver,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Campaign::class);

        /** @var User $user */
        $user = auth()->user();

        $campaigns = QueryBuilder::for(Campaign::forUser($user))
            ->allowedFilters(['partner_id', 'type', 'status', 'channel'])
            ->allowedSorts(['name', 'scheduled_at', 'created_at'])
            ->allowedIncludes(['partner', 'creator', 'interestGroups', 'landingPage'])
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

        if (isset($data['targeting']) && is_array($data['targeting'])) {
            $input = TargetingInput::fromRequest($data['targeting']);
            $data['targeting'] = $this->targetingResolver->resolve($input)->toArray();
        }

        $campaign = Campaign::create($data);

        return new CampaignResource($campaign->load('creator'));
    }

    public function show(Campaign $campaign): CampaignResource
    {
        $this->authorize('view', $campaign);

        $campaign = QueryBuilder::for(Campaign::where('id', $campaign->id))
            ->allowedIncludes(['partner', 'creator', 'interestGroups', 'landingPage'])
            ->firstOrFail();

        return new CampaignResource($campaign);
    }

    public function update(UpdateCampaignRequest $request, Campaign $campaign): CampaignResource
    {
        $this->authorize('update', $campaign);

        $data = $request->validated();

        if (isset($data['targeting']) && is_array($data['targeting'])) {
            $input = TargetingInput::fromRequest($data['targeting']);
            $data['targeting'] = $this->targetingResolver->resolve($input)->toArray();
        }

        $campaign->update($data);

        return new CampaignResource($campaign->fresh());
    }

    public function destroy(Campaign $campaign, CreditService $creditService): JsonResponse
    {
        $this->authorize('delete', $campaign);

        if (! $campaign->is_demo && $campaign->total_price > 0
            && in_array($campaign->status, [CampaignStatus::SCHEDULED, CampaignStatus::SENDING], true)
            && $campaign->partner) {
            $creditService->refund($campaign->partner, (float) $campaign->total_price);
        }

        $campaign->delete();

        return new JsonResponse(['message' => 'Campaign deleted.']);
    }

    public function schedule(ScheduleCampaignRequest $request, Campaign $campaign, CampaignSenderInterface $sender, PricingService $pricingService, StopSmsService $stopSmsService, CreditService $creditService): CampaignResource|JsonResponse
    {
        $this->authorize('update', $campaign);

        if ($error = $this->ensureReadyToSend($campaign, $stopSmsService)) {
            return $error;
        }

        $volume = $sender->estimateVolumeFromTargeting($campaign->targeting ?? []);

        if ($volume <= 0) {
            return new JsonResponse(
                ['message' => 'Volume must be greater than 0.', 'errors' => ['volume' => ['Volume estimation returned 0.']]],
                422,
            );
        }

        $useCi = $campaign->interestGroups()->exists();
        /** @var int $partnerId */
        $partnerId = $campaign->partner_id;

        $estimate = $pricingService->calculate($partnerId, $volume, $useCi);

        $campaign->update([
            'volume_estimated' => $volume,
            'unit_price' => $estimate->unitPrice,
            'total_price' => $estimate->totalPrice,
            'sms_count' => $volume,
        ]);

        if (! $campaign->is_demo && $estimate->totalPrice > 0 && $campaign->partner) {
            try {
                $creditService->deduct($campaign->partner, $estimate->totalPrice);
            } catch (InsufficientCreditsException $e) {
                return new JsonResponse([
                    'message' => $e->getMessage(),
                    'errors' => ['euro_credits' => ["Required: {$e->required}€, available: {$e->available}€"]],
                ], 422);
            }
        }

        $campaign->update([
            'status' => CampaignStatus::SCHEDULED,
            'scheduled_at' => $request->validated('scheduled_at'),
        ]);

        return new CampaignResource($campaign->fresh());
    }

    public function send(Campaign $campaign, CampaignSenderInterface $sender, PricingService $pricingService, StopSmsService $stopSmsService, CreditService $creditService): CampaignResource|JsonResponse
    {
        $this->authorize('send', $campaign);

        if ($error = $this->ensureReadyToSend($campaign, $stopSmsService)) {
            return $error;
        }

        $volume = $sender->estimateVolumeFromTargeting($campaign->targeting ?? []);

        if ($volume <= 0) {
            return new JsonResponse(
                ['message' => 'Volume must be greater than 0.', 'errors' => ['volume' => ['Volume estimation returned 0.']]],
                422,
            );
        }

        $useCi = $campaign->interestGroups()->exists();
        /** @var int $partnerId */
        $partnerId = $campaign->partner_id;

        try {
            $estimate = $pricingService->calculate($partnerId, $volume, $useCi);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 422);
        }

        $campaign->update([
            'volume_estimated' => $volume,
            'unit_price' => $estimate->unitPrice,
            'total_price' => $estimate->totalPrice,
            'sms_count' => $volume,
        ]);

        if (! $campaign->is_demo && $estimate->totalPrice > 0 && $campaign->partner) {
            try {
                $creditService->deduct($campaign->partner, $estimate->totalPrice);
            } catch (InsufficientCreditsException $e) {
                return new JsonResponse([
                    'message' => $e->getMessage(),
                    'errors' => ['euro_credits' => ["Required: {$e->required}€, available: {$e->available}€"]],
                ], 422);
            }
        }

        $result = $sender->send($campaign);

        if (! $result->success) {
            if (! $campaign->is_demo && $estimate->totalPrice > 0 && $campaign->partner) {
                $creditService->refund($campaign->partner, $estimate->totalPrice);
            }

            $campaign->update([
                'status' => CampaignStatus::FAILED,
                'error_message' => $result->error,
            ]);

            return new JsonResponse(['error' => $result->error], 502);
        }

        $campaign->update([
            'status' => CampaignStatus::SENDING,
            'external_id' => $result->externalId,
        ]);

        return new CampaignResource($campaign->fresh());
    }

    public function cancel(Campaign $campaign, CreditService $creditService): CampaignResource
    {
        $this->authorize('cancel', $campaign);

        if (! $campaign->is_demo && $campaign->total_price > 0
            && in_array($campaign->status, [CampaignStatus::SCHEDULED, CampaignStatus::SENDING], true)
            && $campaign->partner) {
            $creditService->refund($campaign->partner, (float) $campaign->total_price);
        }

        $campaign->update([
            'status' => CampaignStatus::CANCELLED,
        ]);

        return new CampaignResource($campaign->fresh());
    }

    public function export(Campaign $campaign, CampaignExportService $exportService): Response|JsonResponse
    {
        $this->authorize('view', $campaign);

        if ($campaign->status !== CampaignStatus::SENT) {
            return new JsonResponse(['message' => 'Only sent campaigns can be exported.'], 422);
        }

        $csv = $exportService->generateCsv($campaign);
        $filename = $exportService->getFilename($campaign);

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    public function stats(Campaign $campaign, CampaignStatsProviderInterface $statsProvider): CampaignStatsResource|JsonResponse
    {
        $this->authorize('view', $campaign);

        if ($campaign->status !== CampaignStatus::SENT) {
            return new JsonResponse(['message' => 'Stats only available for sent campaigns.'], 422);
        }

        if (! $campaign->sent_at) {
            return new JsonResponse(['message' => 'Stats not yet available.', 'available_at' => null], 422);
        }

        $delayHours = (int) config('campaign-sending.notifications.stats_delay_hours', 72);
        $availableAt = $campaign->sent_at->addHours($delayHours);

        if (now()->lt($availableAt)) {
            return new JsonResponse([
                'message' => 'Stats not yet available.',
                'available_at' => $availableAt->toIso8601String(),
            ], 422);
        }

        $stats = $statsProvider->getStats($campaign);

        if (! $stats) {
            return new JsonResponse(['message' => 'Stats retrieval failed.'], 503);
        }

        return new CampaignStatsResource($stats);
    }

    private function ensureReadyToSend(Campaign $campaign, StopSmsService $stopSmsService): ?JsonResponse
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

        if ($stopSmsService->containsBlockedDomain($campaign->message)) {
            return new JsonResponse(
                ['message' => 'Message contains a blocked domain.', 'errors' => ['message' => ['The domain rsms.co is not allowed.']]],
                422,
            );
        }

        return null;
    }
}

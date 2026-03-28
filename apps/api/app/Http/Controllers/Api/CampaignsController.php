<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Contracts\CampaignSenderInterface;
use App\Contracts\CampaignStatsProviderInterface;
use App\DTOs\Targeting\TargetingInput;
use App\Enums\CampaignStatus;
use App\Events\CampaignCancelled;
use App\Events\CampaignDispatched;
use App\Http\Controllers\Controller;
use App\Http\Filters\DateRangeFilter;
use App\Http\Requests\Campaign\IndexCampaignRequest;
use App\Http\Requests\Campaign\ScheduleCampaignRequest;
use App\Http\Requests\Campaign\StoreCampaignRequest;
use App\Http\Requests\Campaign\UpdateCampaignRequest;
use App\Http\Resources\CampaignResource;
use App\Http\Resources\CampaignStatsResource;
use App\Models\Campaign;
use App\Services\CampaignDispatchService;
use App\Services\CampaignExportService;
use App\Services\Targeting\TargetingResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CampaignsController extends Controller
{
    public function __construct(
        private readonly TargetingResolver $targetingResolver,
    ) {}

    public function index(IndexCampaignRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Campaign::class);

        $user = $this->currentUser();

        $campaigns = QueryBuilder::for(Campaign::forUser($user))
            ->allowedFilters([
                AllowedFilter::exact('partner_id'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('channel'),
                AllowedFilter::partial('name'),
                AllowedFilter::callback('status', function (Builder $query, mixed $value): void {
                    $statuses = array_values(array_filter(
                        is_array($value) ? $value : [$value],
                        fn (mixed $status): bool => is_string($status) && $status !== '',
                    ));

                    if ($statuses === []) {
                        return;
                    }

                    $query->whereIn('status', $statuses);
                }),
                AllowedFilter::custom('created_at_from', DateRangeFilter::from('created_at')),
                AllowedFilter::custom('created_at_to', DateRangeFilter::to('created_at')),
            ])
            ->allowedSorts(['name', 'scheduled_at', 'sent_at', 'created_at'])
            ->allowedIncludes(['partner', 'creator', 'interestGroups', 'landingPage'])
            ->paginate(config('api.pagination.default'));

        return CampaignResource::collection($campaigns);
    }

    public function store(StoreCampaignRequest $request): CampaignResource
    {
        $user = $this->currentUser();

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
            ->allowedIncludes(['partner', 'creator', 'interestGroups', 'landingPage', 'router', 'variableSchema'])
            ->withCount('campaignRecipients')
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

    public function destroy(Campaign $campaign, CampaignDispatchService $dispatch): JsonResponse
    {
        $this->authorize('delete', $campaign);

        $dispatch->refundCredits($campaign);

        $campaign->delete();

        return new JsonResponse(['message' => 'Campaign deleted.']);
    }

    public function schedule(ScheduleCampaignRequest $request, Campaign $campaign, CampaignDispatchService $dispatch): CampaignResource|JsonResponse
    {
        $this->authorize('update', $campaign);

        if ($error = $dispatch->validateReadiness($campaign)) {
            return $error;
        }

        $result = $dispatch->estimateAndPrice($campaign);
        if ($result instanceof JsonResponse) {
            return $result;
        }

        if ($error = $dispatch->deductCredits($campaign, $result)) {
            return $error;
        }

        $campaign->update([
            'status' => CampaignStatus::SCHEDULED,
            'scheduled_at' => $request->validated('scheduled_at'),
        ]);

        CampaignDispatched::dispatch($campaign, 'schedule');

        return new CampaignResource($campaign->fresh());
    }

    public function send(Campaign $campaign, CampaignSenderInterface $sender, CampaignDispatchService $dispatch): CampaignResource|JsonResponse
    {
        $this->authorize('send', $campaign);

        if ($error = $dispatch->validateReadiness($campaign)) {
            return $error;
        }

        $estimate = $dispatch->estimateAndPrice($campaign);
        if ($estimate instanceof JsonResponse) {
            return $estimate;
        }

        if ($error = $dispatch->deductCredits($campaign, $estimate)) {
            return $error;
        }

        $campaign->update(['status' => CampaignStatus::SENDING]);

        $result = $sender->send($campaign);

        if (! $result->success) {
            $dispatch->refundCredits($campaign);

            $campaign->update([
                'status' => CampaignStatus::FAILED,
                'error_message' => $result->error,
            ]);

            return new JsonResponse(['message' => $result->error ?? 'Campaign sending failed.'], 502);
        }

        $campaign->update([
            'external_id' => $result->externalId,
        ]);

        CampaignDispatched::dispatch($campaign, 'send');

        return new CampaignResource($campaign->fresh());
    }

    public function cancel(Campaign $campaign, CampaignDispatchService $dispatch): CampaignResource
    {
        $this->authorize('cancel', $campaign);

        $dispatch->refundCredits($campaign);

        $campaign->update([
            'status' => CampaignStatus::CANCELLED,
        ]);

        CampaignCancelled::dispatch($campaign);

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
}

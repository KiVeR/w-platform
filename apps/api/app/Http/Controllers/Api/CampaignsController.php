<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Contracts\CampaignSenderInterface;
use App\Contracts\CampaignStatsProviderInterface;
use App\DTOs\Targeting\TargetingInput;
use App\Enums\CampaignStatus;
use App\Exceptions\InsufficientCreditsException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Campaign\IndexCampaignRequest;
use App\Http\Requests\Campaign\ScheduleCampaignRequest;
use App\Http\Requests\Campaign\StoreCampaignRequest;
use App\Http\Requests\Campaign\UpdateCampaignRequest;
use App\Http\Resources\CampaignResource;
use App\Http\Resources\CampaignStatsResource;
use App\Models\Campaign;
use App\Models\TargetingTemplate;
use App\Services\CampaignExportService;
use App\Services\CampaignSending\StopSmsService;
use App\Services\CreditService;
use App\Services\PricingService;
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
                AllowedFilter::callback('created_at_from', function (Builder $query, mixed $value): void {
                    if (! is_string($value) || $value === '') {
                        return;
                    }

                    $query->whereDate('created_at', '>=', $value);
                }),
                AllowedFilter::callback('created_at_to', function (Builder $query, mixed $value): void {
                    if (! is_string($value) || $value === '') {
                        return;
                    }

                    $query->whereDate('created_at', '<=', $value);
                }),
            ])
            ->allowedSorts(['name', 'scheduled_at', 'sent_at', 'created_at'])
            ->allowedIncludes(['partner', 'creator', 'interestGroups', 'landingPage'])
            ->paginate(15);

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

        $this->autoSaveTargetingTemplate($campaign);

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

    private function autoSaveTargetingTemplate(Campaign $campaign): void
    {
        if (! $campaign->partner_id || ! $campaign->targeting || $campaign->is_demo) {
            return;
        }

        $targeting = $campaign->targeting;
        $sorted = $targeting;
        ksort($sorted);
        $hash = md5((string) json_encode($sorted));

        $existing = TargetingTemplate::where('partner_id', $campaign->partner_id)
            ->get()
            ->first(fn (TargetingTemplate $t) => $t->getTargetingHash() === $hash);

        if ($existing) {
            $existing->increment('usage_count');
            $existing->update(['last_used_at' => now()]);

            return;
        }

        TargetingTemplate::create([
            'partner_id' => $campaign->partner_id,
            'name' => $this->generateTemplateName($targeting),
            'targeting_json' => $targeting,
            'usage_count' => 1,
            'last_used_at' => now(),
        ]);
    }

    /** @param array<string, mixed> $targeting */
    private function generateTemplateName(array $targeting): string
    {
        $method = $targeting['method'] ?? 'unknown';
        $gender = match ($targeting['gender'] ?? null) {
            'M' => 'Hommes',
            'F' => 'Femmes',
            default => 'Mixte',
        };

        $ageMin = $targeting['age_min'] ?? null;
        $ageMax = $targeting['age_max'] ?? null;
        $agePart = '';
        if ($ageMin && $ageMax) {
            $agePart = " {$ageMin}-{$ageMax}";
        } elseif ($ageMin) {
            $agePart = " {$ageMin}+";
        }

        return match ($method) {
            'department' => 'Zone Dept '.implode(', ', array_slice($targeting['departments'] ?? [], 0, 3))
                .(count($targeting['departments'] ?? []) > 3 ? '...' : '')
                ." — {$gender}{$agePart}",
            'postcode' => 'CP '.implode(', ', array_slice($targeting['postcodes'] ?? [], 0, 3))
                .(count($targeting['postcodes'] ?? []) > 3 ? '...' : '')
                ." — {$gender}{$agePart}",
            'address' => 'Rayon '.round(($targeting['radius'] ?? 0) / 1000).' km'
                .($targeting['address'] ? ' — '.mb_substr($targeting['address'], 0, 20) : '')
                ." — {$gender}{$agePart}",
            default => "Zone {$gender}{$agePart}",
        };
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

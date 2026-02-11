<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PartnerPricing\StorePartnerPricingRequest;
use App\Http\Requests\PartnerPricing\UpdatePartnerPricingRequest;
use App\Http\Resources\PartnerPricingResource;
use App\Models\PartnerPricing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PartnerPricingsController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', PartnerPricing::class);

        $pricings = QueryBuilder::for(PartnerPricing::class)
            ->allowedFilters([
                AllowedFilter::exact('partner_id'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('is_default'),
            ])
            ->allowedSorts(['name', 'volume_min', 'created_at'])
            ->allowedIncludes(['partner'])
            ->paginate(15);

        return PartnerPricingResource::collection($pricings);
    }

    public function store(StorePartnerPricingRequest $request): PartnerPricingResource
    {
        $this->authorize('create', PartnerPricing::class);

        $pricing = PartnerPricing::create($request->validated());

        return new PartnerPricingResource($pricing);
    }

    public function show(PartnerPricing $partnerPricing): PartnerPricingResource
    {
        $this->authorize('view', $partnerPricing);

        $partnerPricing = QueryBuilder::for(PartnerPricing::where('id', $partnerPricing->id))
            ->allowedIncludes(['partner'])
            ->firstOrFail();

        return new PartnerPricingResource($partnerPricing);
    }

    public function update(UpdatePartnerPricingRequest $request, PartnerPricing $partnerPricing): PartnerPricingResource
    {
        $this->authorize('update', $partnerPricing);

        $partnerPricing->update($request->validated());

        return new PartnerPricingResource($partnerPricing->fresh());
    }

    public function destroy(PartnerPricing $partnerPricing): JsonResponse
    {
        $this->authorize('delete', $partnerPricing);

        $partnerPricing->delete();

        return new JsonResponse(['message' => 'Partner pricing deleted.']);
    }
}

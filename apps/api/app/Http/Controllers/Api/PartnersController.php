<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Partner\StorePartnerRequest;
use App\Http\Requests\Partner\UpdatePartnerRequest;
use App\Http\Resources\PartnerResource;
use App\Models\Partner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PartnersController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Partner::class);

        $partners = QueryBuilder::for(Partner::class)
            ->allowedFilters([AllowedFilter::partial('name'), AllowedFilter::exact('is_active')])
            ->allowedSorts(['name', 'created_at'])
            ->allowedIncludes(['users', 'shops'])
            ->withCount(['users', 'shops'])
            ->paginate(15);

        return PartnerResource::collection($partners);
    }

    public function store(StorePartnerRequest $request): PartnerResource
    {
        $this->authorize('create', Partner::class);

        $partner = Partner::create($request->validated());

        return new PartnerResource($partner);
    }

    public function show(Partner $partner): PartnerResource
    {
        $this->authorize('view', $partner);

        $partner = QueryBuilder::for(Partner::where('id', $partner->id))
            ->allowedIncludes(['users', 'shops'])
            ->withCount(['users', 'shops'])
            ->firstOrFail();

        return new PartnerResource($partner);
    }

    public function update(UpdatePartnerRequest $request, Partner $partner): PartnerResource
    {
        $this->authorize('update', $partner);

        $partner->update($request->validated());

        return new PartnerResource($partner->fresh());
    }

    public function destroy(Partner $partner): JsonResponse
    {
        $this->authorize('delete', $partner);

        $partner->delete();

        return new JsonResponse(['message' => 'Partner deleted.']);
    }
}

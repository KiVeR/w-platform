<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\StoreShopRequest;
use App\Http\Requests\Shop\UpdateShopRequest;
use App\Http\Resources\ShopResource;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ShopsController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Shop::class);

        $user = $this->currentUser();

        $shops = QueryBuilder::for(Shop::forUser($user))
            ->allowedFilters([AllowedFilter::exact('partner_id'), 'city', AllowedFilter::exact('is_active')])
            ->allowedSorts(['name', 'city', 'created_at'])
            ->allowedIncludes(['partner'])
            ->paginate(15);

        return ShopResource::collection($shops);
    }

    public function store(StoreShopRequest $request): ShopResource
    {
        $user = $this->currentUser();

        $data = $request->validated();

        if (! $user->hasRole('admin')) {
            $data['partner_id'] = $user->partner_id;
        }

        $this->authorize('create', Shop::class);

        $shop = Shop::create($data);

        return new ShopResource($shop);
    }

    public function show(Shop $shop): ShopResource
    {
        $this->authorize('view', $shop);

        $shop = QueryBuilder::for(Shop::where('id', $shop->id))
            ->allowedIncludes(['partner'])
            ->firstOrFail();

        return new ShopResource($shop);
    }

    public function update(UpdateShopRequest $request, Shop $shop): ShopResource
    {
        $this->authorize('update', $shop);

        $shop->update($request->validated());

        return new ShopResource($shop->fresh());
    }

    public function destroy(Shop $shop): JsonResponse
    {
        $this->authorize('delete', $shop);

        $shop->delete();

        return new JsonResponse(['message' => 'Shop deleted.']);
    }
}

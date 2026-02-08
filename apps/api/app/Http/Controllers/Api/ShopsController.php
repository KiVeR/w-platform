<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\StoreShopRequest;
use App\Http\Requests\Shop\UpdateShopRequest;
use App\Http\Resources\ShopResource;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\QueryBuilder;

class ShopsController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Shop::class);

        /** @var User $user */
        $user = auth()->user();

        $query = Shop::query();

        if (! $user->hasRole('admin')) {
            $query->where('partner_id', $user->partner_id);
        }

        $shops = QueryBuilder::for($query)
            ->allowedFilters(['partner_id', 'city', 'is_active'])
            ->allowedSorts(['name', 'city', 'created_at'])
            ->allowedIncludes(['partner'])
            ->paginate(15);

        return ShopResource::collection($shops);
    }

    public function store(StoreShopRequest $request): ShopResource
    {
        /** @var User $user */
        $user = auth()->user();

        $data = $request->validated();

        if (! $user->hasRole('admin')) {
            $data['partner_id'] = $user->partner_id;
        }

        $shop = new Shop($data);
        $this->authorize('create', $shop);

        $shop->save();

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

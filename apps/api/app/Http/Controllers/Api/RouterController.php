<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Router\StoreRouterRequest;
use App\Http\Requests\Router\UpdateRouterRequest;
use App\Http\Resources\RouterResource;
use App\Models\Router;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RouterController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Router::class);

        $routers = QueryBuilder::for(Router::class)
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['name', 'external_id', 'created_at'])
            ->withCount(['partners', 'campaigns'])
            ->paginate(config('api.pagination.default'));

        return RouterResource::collection($routers);
    }

    public function store(StoreRouterRequest $request): RouterResource
    {
        $this->authorize('create', Router::class);

        $router = Router::create($request->validated());

        return new RouterResource($router->refresh());
    }

    public function update(UpdateRouterRequest $request, Router $router): RouterResource
    {
        $this->authorize('update', $router);

        $router->update($request->validated());

        return new RouterResource($router->refresh());
    }

    public function destroy(Router $router): JsonResponse
    {
        $this->authorize('delete', $router);

        if ($router->partners()->exists() || $router->campaigns()->exists()) {
            return new JsonResponse(['message' => 'Router is in use. Disable it instead.'], 409);
        }

        $router->delete();

        return new JsonResponse(['message' => 'Router deleted.']);
    }
}

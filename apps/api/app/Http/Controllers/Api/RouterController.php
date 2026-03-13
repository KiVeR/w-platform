<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RouterResource;
use App\Models\Router;
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
            ->paginate(15);

        return RouterResource::collection($routers);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Geo\BatchIrisRequest;
use App\Http\Requests\Geo\LookupIrisRequest;
use App\Http\Resources\IrisZoneResource;
use App\Models\IrisZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use MatanYadaev\EloquentSpatial\Objects\Point;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class IrisZonesController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $zones = QueryBuilder::for(IrisZone::class)
            ->allowedFilters([
                AllowedFilter::exact('department_code'),
                AllowedFilter::exact('commune_code'),
                AllowedFilter::exact('iris_type'),
                AllowedFilter::partial('name'),
            ])
            ->allowedSorts(['code', 'name', 'commune_name'])
            ->select(['code', 'name', 'department_code', 'commune_code', 'commune_name', 'iris_type'])
            ->paginate(min((int) request()->query('per_page', '50'), 200));

        return IrisZoneResource::collection($zones);
    }

    public function show(string $code): IrisZoneResource
    {
        $zone = IrisZone::where('code', $code)->firstOrFail();

        return new IrisZoneResource($zone);
    }

    public function geometry(string $code): JsonResponse
    {
        $zone = Cache::remember(
            "geo:iris:{$code}:geometry",
            config('api.cache.geo.ttl'),
            fn () => IrisZone::where('code', $code)->firstOrFail()
        );

        return response()->json($zone->geometry?->toArray());
    }

    public function lookup(LookupIrisRequest $request): AnonymousResourceCollection
    {
        $point = new Point((float) $request->validated('lat'), (float) $request->validated('lng'), 4326);

        $zones = IrisZone::query()->whereContains('geometry', $point)->get();

        return IrisZoneResource::collection($zones);
    }

    public function batch(BatchIrisRequest $request): AnonymousResourceCollection
    {
        /** @var list<string> $codes */
        $codes = $request->validated('codes');

        $zones = IrisZone::query()
            ->whereIn('code', $codes)
            ->select([
                'code', 'name', 'department_code', 'commune_code', 'commune_name', 'iris_type',
                DB::raw('ST_Simplify(geometry::geometry, 0.0001) as geometry'),
            ])
            ->get();

        return IrisZoneResource::collection($zones);
    }
}

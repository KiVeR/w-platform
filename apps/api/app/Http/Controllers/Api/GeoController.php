<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommuneResource;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\RegionResource;
use App\Models\Department;
use App\Models\Region;
use App\Services\Geo\GeoApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class GeoController extends Controller
{
    public function __construct(
        private readonly GeoApiService $geoApi,
    ) {}

    public function departments(Request $request): AnonymousResourceCollection
    {
        $ttl = config('api.cache.geo.ttl');

        if ($request->query('include') !== 'geometry') {
            $departments = Cache::remember('geo:departments:index', $ttl, fn () => Department::orderBy('code')->get());

            return DepartmentResource::collection($departments);
        }

        $departments = Department::query()
            ->select(['code', 'name', 'region_code', DB::raw('ST_Simplify(geometry::geometry, 0.001) as geometry')])
            ->orderBy('code')
            ->get();

        return DepartmentResource::collection($departments);
    }

    public function showDepartment(string $code): DepartmentResource
    {
        $ttl = config('api.cache.geo.ttl');
        $department = Cache::remember(
            "geo:departments:{$code}",
            $ttl,
            fn () => Department::where('code', $code)->firstOrFail()
        );

        return new DepartmentResource($department);
    }

    public function departmentGeometry(string $code): JsonResponse
    {
        $ttl = config('api.cache.geo.ttl');
        $department = Cache::remember(
            "geo:departments:{$code}:geometry",
            $ttl,
            fn () => Department::where('code', $code)->firstOrFail()
        );

        return response()->json($department->geometry?->toArray());
    }

    public function regions(Request $request): AnonymousResourceCollection
    {
        $ttl = config('api.cache.geo.ttl');

        if ($request->query('include') !== 'geometry') {
            $regions = Cache::remember('geo:regions:index', $ttl, fn () => Region::orderBy('code')->get());

            return RegionResource::collection($regions);
        }

        $regions = Region::query()
            ->select(['code', 'name', DB::raw('ST_Simplify(geometry::geometry, 0.001) as geometry')])
            ->orderBy('code')
            ->get();

        return RegionResource::collection($regions);
    }

    public function showRegion(string $code): RegionResource
    {
        $ttl = config('api.cache.geo.ttl');
        $region = Cache::remember(
            "geo:regions:{$code}",
            $ttl,
            fn () => Region::where('code', $code)->firstOrFail()
        );

        return new RegionResource($region);
    }

    public function regionGeometry(string $code): JsonResponse
    {
        $ttl = config('api.cache.geo.ttl');
        $region = Cache::remember(
            "geo:regions:{$code}:geometry",
            $ttl,
            fn () => Region::where('code', $code)->firstOrFail()
        );

        return response()->json($region->geometry?->toArray());
    }

    public function communes(Request $request): AnonymousResourceCollection
    {
        $filters = array_filter([
            'codePostal' => $request->input('filter.codePostal'),
            'nom' => $request->input('filter.nom'),
        ]);

        $ttl = config('api.cache.geo.ttl');
        $communes = Cache::remember(
            'geo:communes:' . md5($request->fullUrl()),
            $ttl,
            fn () => $this->geoApi->searchCommunes($filters)
        );

        return CommuneResource::collection($communes);
    }

    public function showCommune(string $code): CommuneResource
    {
        $ttl = config('api.cache.geo.ttl');
        $commune = Cache::remember(
            "geo:communes:{$code}",
            $ttl,
            fn () => $this->geoApi->getCommune($code)
        );

        if ($commune === null) {
            abort(404, 'Commune not found.');
        }

        return new CommuneResource($commune);
    }
}

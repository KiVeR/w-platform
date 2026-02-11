<?php

declare(strict_types=1);

namespace App\Services\Geo;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GeoApiService
{
    public function __construct(
        private readonly string $baseUrl = 'https://geo.api.gouv.fr',
        private readonly int $timeout = 10,
    ) {}

    /** @return array<int, array<string, mixed>> */
    public function getRegions(): array
    {
        return $this->request()->get('/regions')->json();
    }

    /** @return array<string, mixed> */
    public function getRegionWithContour(string $code): array
    {
        return $this->request()
            ->get("/regions/{$code}", ['fields' => 'nom,code,codeRegion', 'format' => 'geojson'])
            ->json();
    }

    /** @return array<int, array<string, mixed>> */
    public function getDepartments(): array
    {
        return $this->request()->get('/departements')->json();
    }

    /** @return array<string, mixed> */
    public function getDepartmentWithContour(string $code): array
    {
        return $this->request()
            ->get("/departements/{$code}", ['fields' => 'nom,code,codeRegion', 'format' => 'geojson'])
            ->json();
    }

    /**
     * @param  array<string, string>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function searchCommunes(array $filters): array
    {
        return $this->request()->get('/communes', [
            ...$filters,
            'fields' => 'nom,code,codesPostaux,population,departement,region',
            'format' => 'json',
            'limit' => 20,
        ])->json();
    }

    /** @return array<string, mixed>|null */
    public function getCommune(string $code): ?array
    {
        return Cache::remember("geo:commune:{$code}", 86400, function () use ($code): ?array {
            $response = $this->request()->get("/communes/{$code}", [
                'fields' => 'nom,code,codesPostaux,population,departement,region,contour',
                'format' => 'geojson',
            ]);

            if ($response->failed()) {
                return null;
            }

            return $response->json();
        });
    }

    protected function request(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->timeout($this->timeout)
            ->acceptJson();
    }
}

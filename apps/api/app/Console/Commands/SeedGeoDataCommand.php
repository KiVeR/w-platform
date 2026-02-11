<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\IrisZone;
use App\Models\Region;
use App\Services\Geo\GeoApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use JsonMachine\Items;
use JsonMachine\JsonDecoder\ExtJsonDecoder;

class SeedGeoDataCommand extends Command
{
    /** @var string */
    protected $signature = 'geo:seed
        {--regions : Seed regions only}
        {--departments : Seed departments only}
        {--iris : Seed IRIS zones only}
        {--file= : Custom GeoJSON file for IRIS import}';

    /** @var string */
    protected $description = 'Seed geographic data (regions, departments, IRIS zones)';

    public function handle(GeoApiService $geoApi): int
    {
        $seedAll = ! $this->option('regions') && ! $this->option('departments') && ! $this->option('iris');

        if ($seedAll || $this->option('regions')) {
            $this->seedRegions($geoApi);
        }

        if ($seedAll || $this->option('departments')) {
            $this->seedDepartments($geoApi);
        }

        if ($seedAll || $this->option('iris')) {
            $this->seedIris();
        }

        Cache::flush();
        $this->info('Geo cache cleared.');

        return self::SUCCESS;
    }

    protected function seedRegions(GeoApiService $geoApi): void
    {
        $this->info('Seeding regions...');

        $regions = $geoApi->getRegions();
        $bar = $this->output->createProgressBar(count($regions));

        foreach ($regions as $region) {
            Region::updateOrCreate(
                ['code' => $region['code']],
                ['name' => $region['nom']],
            );
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info(count($regions).' regions seeded.');
    }

    protected function seedDepartments(GeoApiService $geoApi): void
    {
        $this->info('Seeding departments...');

        $departments = $geoApi->getDepartments();
        $bar = $this->output->createProgressBar(count($departments));

        foreach ($departments as $dept) {
            Department::updateOrCreate(
                ['code' => $dept['code']],
                [
                    'name' => $dept['nom'],
                    'region_code' => $dept['codeRegion'],
                ],
            );
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info(count($departments).' departments seeded.');
    }

    protected function seedIris(): void
    {
        $file = $this->option('file') ?? storage_path('geodata/iris-zones.geojson');

        if (! file_exists($file)) {
            $this->error("IRIS GeoJSON file not found: {$file}");
            $this->line('Convert CONTOURS-IRIS.shp to GeoJSON first:');
            $this->line('  ogr2ogr -f GeoJSON -t_srs EPSG:4326 -lco COORDINATE_PRECISION=6 storage/geodata/iris-zones.geojson CONTOURS-IRIS.shp');

            return;
        }

        $this->info('Seeding IRIS zones from: '.$file);

        $items = Items::fromFile($file, [
            'pointer' => '/features',
            'decoder' => new ExtJsonDecoder(true),
        ]);

        $batch = [];
        $count = 0;

        $bar = $this->output->createProgressBar();
        $bar->setFormat(' %current% zones [%bar%] %elapsed%');

        foreach ($items as $feature) {
            $props = $feature['properties'];
            $code = $props['CODE_IRIS'] ?? $props['code_iris'] ?? null;

            if (! $code) {
                continue;
            }

            $batch[] = [
                'code' => $code,
                'name' => $props['NOM_IRIS'] ?? $props['nom_iris'] ?? '',
                'department_code' => $this->deriveDepartmentCode($code),
                'commune_code' => $props['INSEE_COM'] ?? $props['insee_com'] ?? substr($code, 0, 5),
                'commune_name' => $props['NOM_COM'] ?? $props['nom_com'] ?? '',
                'iris_type' => $props['TYP_IRIS'] ?? $props['typ_iris'] ?? 'Z',
                'geometry' => json_encode($feature['geometry']),
            ];

            if (count($batch) >= 500) {
                $this->upsertIrisBatch($batch);
                $count += count($batch);
                $bar->setProgress($count);
                $batch = [];
            }
        }

        if ($batch !== []) {
            $this->upsertIrisBatch($batch);
            $count += count($batch);
            $bar->setProgress($count);
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$count} IRIS zones seeded.");
    }

    /** @param list<array<string, mixed>> $batch */
    protected function upsertIrisBatch(array $batch): void
    {
        $now = now();

        DB::transaction(function () use ($batch, $now): void {
            foreach ($batch as $row) {
                $geometry = $row['geometry'];
                unset($row['geometry']);

                IrisZone::upsert(
                    [array_merge($row, ['created_at' => $now, 'updated_at' => $now])],
                    ['code'],
                    ['name', 'commune_code', 'commune_name', 'iris_type', 'updated_at'],
                );

                if ($geometry) {
                    DB::statement(
                        'UPDATE iris_zones SET geometry = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)::geography WHERE code = ?',
                        [$geometry, $row['code']],
                    );
                }
            }
        });
    }

    public function deriveDepartmentCode(string $irisCode): string
    {
        $prefix = substr($irisCode, 0, 2);

        if ($prefix === '97') {
            return substr($irisCode, 0, 3);
        }

        if (str_starts_with($irisCode, '2A') || str_starts_with($irisCode, '2B')) {
            return substr($irisCode, 0, 2);
        }

        return $prefix;
    }
}

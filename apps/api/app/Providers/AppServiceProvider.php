<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\TargetingAdapterInterface;
use App\Services\Geo\GeoApiService;
use App\Services\Targeting\Adapters\WepakTargetingAdapter;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;
use MatanYadaev\EloquentSpatial\EloquentSpatial;
use MatanYadaev\EloquentSpatial\Enums\Srid;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(GeoApiService::class, fn (): GeoApiService => new GeoApiService(
            baseUrl: (string) config('services.geo_api.base_url'),
            timeout: (int) config('services.geo_api.timeout'),
        ));

        $this->app->singleton(TargetingAdapterInterface::class, WepakTargetingAdapter::class);
    }

    public function boot(): void
    {
        EloquentSpatial::setDefaultSrid(Srid::WGS84);

        Passport::tokensExpireIn(now()->addHours(24));
        Passport::refreshTokensExpireIn(now()->addDays(30));
        Passport::personalAccessTokensExpireIn(now()->addHours(24));

        Gate::define('viewApiDocs', function () {
            return app()->environment('local');
        });
    }
}

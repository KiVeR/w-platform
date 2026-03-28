<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\AIDriverInterface;
use App\Contracts\SmsRoutingDriverInterface;
use App\Contracts\TargetingAdapterInterface;
use App\Models\Campaign;
use App\Observers\CampaignObserver;
use App\Services\AI\AIGenerationManager;
use App\Services\Geo\GeoApiService;
use App\Services\SmsRouting\SmsRoutingManager;
use App\Services\Targeting\Adapters\WepakTargetingAdapter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
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

        $this->app->singleton(SmsRoutingManager::class, fn ($app): SmsRoutingManager => new SmsRoutingManager($app));
        $this->app->bind(SmsRoutingDriverInterface::class, fn ($app): SmsRoutingDriverInterface => $app->make(SmsRoutingManager::class)->driver());

        $this->app->singleton(AIGenerationManager::class, fn ($app): AIGenerationManager => new AIGenerationManager($app));
        $this->app->bind(AIDriverInterface::class, fn ($app): AIDriverInterface => $app->make(AIGenerationManager::class)->driver());
    }

    public function boot(): void
    {
        EloquentSpatial::setDefaultSrid(Srid::WGS84);
        Campaign::observe(CampaignObserver::class);

        Passport::tokensExpireIn(now()->addHours(24));
        Passport::refreshTokensExpireIn(now()->addDays(30));
        Passport::personalAccessTokensExpireIn(now()->addHours(24));

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('restore-version', function (Request $request) {
            return Limit::perHour(10)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('webhooks', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });

        Gate::define('viewApiDocs', function () {
            return app()->environment('local');
        });
    }
}

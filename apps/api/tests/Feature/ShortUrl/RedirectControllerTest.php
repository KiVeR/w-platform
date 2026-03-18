<?php

declare(strict_types=1);

use App\Jobs\IncrementClickCountJob;
use App\Http\Controllers\RedirectController;
use App\Models\ShortUrl;
use App\Models\ShortUrlSuffix;
use Illuminate\Support\Facades\Bus;

it('redirects to destination URL for valid slug with 302', function (): void {
    Bus::fake([IncrementClickCountJob::class]);

    $shortUrl = ShortUrl::factory()->create([
        'slug' => 'test-redirect',
        'link' => 'https://example.com/destination',
        'is_enabled' => true,
        'is_draft' => false,
    ]);

    $response = $this->get('/test-redirect');

    $response->assertRedirect('https://example.com/destination');
});

it('returns 404 for unknown slug', function (): void {
    Bus::fake([IncrementClickCountJob::class]);

    $response = $this->get('/nonexistent-slug');

    $response->assertNotFound();
});

it('returns 404 for disabled short url', function (): void {
    Bus::fake([IncrementClickCountJob::class]);

    ShortUrl::factory()->create([
        'slug' => 'disabled-slug',
        'link' => 'https://example.com',
        'is_enabled' => false,
    ]);

    $response = $this->get('/disabled-slug');

    $response->assertNotFound();
});

it('handles slug with suffix and redirects to destination', function (): void {
    Bus::fake([IncrementClickCountJob::class]);

    $shortUrl = ShortUrl::factory()->create([
        'slug' => 'tracked-slug',
        'link' => 'https://example.com/tracked',
        'is_enabled' => true,
        'is_draft' => false,
        'is_traceable_by_recipient' => true,
    ]);

    ShortUrlSuffix::factory()->create([
        'slug' => 'abc123',
        'short_url_id' => $shortUrl->id,
    ]);

    $response = $this->get('/tracked-slug_abc123');

    $response->assertRedirect('https://example.com/tracked');
});

it('dispatches IncrementClickCountJob on redirect', function (): void {
    Bus::fake([IncrementClickCountJob::class]);

    ShortUrl::factory()->create([
        'slug' => 'dispatch-test',
        'link' => 'https://example.com/dispatch',
        'is_enabled' => true,
        'is_draft' => false,
    ]);

    $this->get('/dispatch-test');

    Bus::assertDispatched(IncrementClickCountJob::class, function (IncrementClickCountJob $job): bool {
        return $job->shortUrlId === ShortUrl::where('slug', 'dispatch-test')->first()->id;
    });
});

it('dispatches IncrementClickCountJob with suffix when present', function (): void {
    Bus::fake([IncrementClickCountJob::class]);

    $shortUrl = ShortUrl::factory()->create([
        'slug' => 'suffix-dispatch',
        'link' => 'https://example.com/suffixed',
        'is_enabled' => true,
        'is_draft' => false,
    ]);

    $this->get('/suffix-dispatch_mysuffix');

    Bus::assertDispatched(IncrementClickCountJob::class, function (IncrementClickCountJob $job): bool {
        return $job->suffix === 'mysuffix';
    });
});

it('builds internal redirect URL when link is null', function (): void {
    Bus::fake([IncrementClickCountJob::class]);

    $shortUrl = ShortUrl::factory()->create([
        'slug' => 'internal-slug',
        'link' => null,
        'is_enabled' => true,
        'is_draft' => false,
    ]);

    $response = $this->get('/internal-slug');

    $expectedUrl = config('short-url.redirect_internal_url').'/internal-slug';
    if (! str_starts_with($expectedUrl, 'http')) {
        $expectedUrl = 'https://'.$expectedUrl;
    }

    $response->assertRedirect($expectedUrl);
});

it('registers redirect routes for the configured short-url domains', function (): void {
    $domains = collect(app('router')->getRoutes()->getRoutes())
        ->filter(fn ($route): bool => $route->uri() === '{slug}' && ltrim($route->getActionName(), '\\') === RedirectController::class.'@redirect')
        ->map(fn ($route): ?string => $route->getDomain())
        ->values()
        ->all();

    $expectedDomains = collect([
        parse_url((string) config('short-url.redirect_external_url'), PHP_URL_HOST),
        parse_url((string) config('short-url.redirect_internal_url'), PHP_URL_HOST),
    ])->filter()->values();

    foreach ($expectedDomains as $expectedDomain) {
        expect($domains)->toContain($expectedDomain);
    }

    expect($domains)->toContain(null);
});

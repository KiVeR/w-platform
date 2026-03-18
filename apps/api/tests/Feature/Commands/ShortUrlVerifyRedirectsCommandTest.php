<?php

declare(strict_types=1);

use App\Models\ShortUrl;
use Illuminate\Support\Facades\Http;

it('requires both baseline and platform urls', function (): void {
    $this->artisan('short-url:verify-redirects')
        ->expectsOutputToContain('Both --old-url and --new-url options are required.')
        ->assertFailed();
});

it('reports success when all enabled short urls match', function (): void {
    $first = ShortUrl::factory()->create(['slug' => 'promo-match', 'is_enabled' => true]);
    $second = ShortUrl::factory()->create(['slug' => 'promo-match-2', 'is_enabled' => true]);
    ShortUrl::factory()->create(['slug' => 'disabled', 'is_enabled' => false]);

    Http::fake(function (\Illuminate\Http\Client\Request $request) use ($first, $second) {
        $slug = basename($request->url());
        $location = match ($slug) {
            $first->slug => 'https://example.com/promo-match',
            $second->slug => 'https://example.com/promo-match-2',
            default => 'https://example.com/unknown',
        };

        return Http::response('', 302, ['Location' => $location]);
    });

    $this->artisan('short-url:verify-redirects', [
        '--old-url' => 'https://legacy-short-url.test',
        '--new-url' => 'https://platform-api.test',
        '--limit' => 10,
    ])
        ->expectsOutputToContain('All redirects match. Safe to proceed with cutover.')
        ->assertSuccessful();
});

it('fails when a redirect mismatch is detected', function (): void {
    $shortUrl = ShortUrl::factory()->create(['slug' => 'promo-mismatch', 'is_enabled' => true]);

    Http::fake(function (\Illuminate\Http\Client\Request $request) use ($shortUrl) {
        $isLegacy = str_starts_with($request->url(), 'https://legacy-short-url.test');

        return Http::response('', 302, [
            'Location' => $isLegacy
                ? "https://example.com/{$shortUrl->slug}"
                : "https://platform.example.com/{$shortUrl->slug}",
        ]);
    });

    $this->artisan('short-url:verify-redirects', [
        '--old-url' => 'https://legacy-short-url.test',
        '--new-url' => 'https://platform-api.test',
        '--limit' => 1,
    ])
        ->expectsOutputToContain("MISMATCH: /{$shortUrl->slug}")
        ->expectsOutputToContain('Redirect mismatches or errors detected. Do NOT proceed with cutover.')
        ->assertFailed();
});

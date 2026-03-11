<?php

declare(strict_types=1);

use App\Jobs\IncrementClickCountJob;
use App\Models\ShortUrl;
use App\Models\ShortUrlSuffix;

it('increments click_count for a human user agent', function (): void {
    $shortUrl = ShortUrl::factory()->create([
        'is_enabled' => true,
        'is_draft' => false,
        'click_count' => 0,
        'click_count_bots' => 0,
    ]);

    $humanUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

    $job = new IncrementClickCountJob($shortUrl->id, $humanUa, null, null);
    app()->call([$job, 'handle']);

    $shortUrl->refresh();
    expect($shortUrl->click_count)->toBe(1)
        ->and($shortUrl->click_count_bots)->toBe(0);
});

it('increments click_count_bots for a bot user agent', function (): void {
    $shortUrl = ShortUrl::factory()->create([
        'is_enabled' => true,
        'is_draft' => false,
        'click_count' => 0,
        'click_count_bots' => 0,
    ]);

    $botUa = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

    $job = new IncrementClickCountJob($shortUrl->id, $botUa, null, null);
    app()->call([$job, 'handle']);

    $shortUrl->refresh();
    expect($shortUrl->click_count)->toBe(0)
        ->and($shortUrl->click_count_bots)->toBe(1);
});

it('increments suffix click_count for a human when traceable', function (): void {
    $shortUrl = ShortUrl::factory()->create([
        'is_enabled' => true,
        'is_draft' => false,
        'is_traceable_by_recipient' => true,
        'click_count' => 0,
        'click_count_bots' => 0,
    ]);

    $suffix = ShortUrlSuffix::factory()->create([
        'slug' => 'suffix-human',
        'short_url_id' => $shortUrl->id,
        'click_count' => 0,
        'click_count_bots' => 0,
    ]);

    $humanUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

    $job = new IncrementClickCountJob($shortUrl->id, $humanUa, null, null, 'suffix-human');
    app()->call([$job, 'handle']);

    $suffix->refresh();
    expect($suffix->click_count)->toBe(1)
        ->and($suffix->click_count_bots)->toBe(0);
});

it('increments suffix click_count_bots for a bot when traceable', function (): void {
    $shortUrl = ShortUrl::factory()->create([
        'is_enabled' => true,
        'is_draft' => false,
        'is_traceable_by_recipient' => true,
        'click_count' => 0,
        'click_count_bots' => 0,
    ]);

    $suffix = ShortUrlSuffix::factory()->create([
        'slug' => 'suffix-bot',
        'short_url_id' => $shortUrl->id,
        'click_count' => 0,
        'click_count_bots' => 0,
    ]);

    $botUa = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

    $job = new IncrementClickCountJob($shortUrl->id, $botUa, null, null, 'suffix-bot');
    app()->call([$job, 'handle']);

    $suffix->refresh();
    expect($suffix->click_count)->toBe(0)
        ->and($suffix->click_count_bots)->toBe(1);

    $shortUrl->refresh();
    expect($shortUrl->click_count)->toBe(0)
        ->and($shortUrl->click_count_bots)->toBe(1);
});

it('does not increment suffix when not traceable', function (): void {
    $shortUrl = ShortUrl::factory()->create([
        'is_enabled' => true,
        'is_draft' => false,
        'is_traceable_by_recipient' => false,
        'click_count' => 0,
        'click_count_bots' => 0,
    ]);

    $suffix = ShortUrlSuffix::factory()->create([
        'slug' => 'suffix-not-traceable',
        'short_url_id' => $shortUrl->id,
        'click_count' => 0,
        'click_count_bots' => 0,
    ]);

    $humanUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

    $job = new IncrementClickCountJob($shortUrl->id, $humanUa, null, null, 'suffix-not-traceable');
    app()->call([$job, 'handle']);

    // Suffix unchanged
    $suffix->refresh();
    expect($suffix->click_count)->toBe(0)
        ->and($suffix->click_count_bots)->toBe(0);

    // But global click_count is still incremented
    $shortUrl->refresh();
    expect($shortUrl->click_count)->toBe(1);
});

it('skips processing when short url is disabled', function (): void {
    $shortUrl = ShortUrl::factory()->create([
        'is_enabled' => false,
        'is_draft' => false,
        'click_count' => 0,
        'click_count_bots' => 0,
    ]);

    $humanUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

    $job = new IncrementClickCountJob($shortUrl->id, $humanUa, null, null);
    app()->call([$job, 'handle']);

    $shortUrl->refresh();
    expect($shortUrl->click_count)->toBe(0)
        ->and($shortUrl->click_count_bots)->toBe(0);
});

it('skips processing when short url is draft', function (): void {
    $shortUrl = ShortUrl::factory()->create([
        'is_enabled' => true,
        'is_draft' => true,
        'click_count' => 0,
        'click_count_bots' => 0,
    ]);

    $humanUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

    $job = new IncrementClickCountJob($shortUrl->id, $humanUa, null, null);
    app()->call([$job, 'handle']);

    $shortUrl->refresh();
    expect($shortUrl->click_count)->toBe(0)
        ->and($shortUrl->click_count_bots)->toBe(0);
});

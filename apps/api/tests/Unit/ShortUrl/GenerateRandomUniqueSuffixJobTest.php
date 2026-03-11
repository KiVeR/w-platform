<?php

declare(strict_types=1);

use App\Jobs\GenerateRandomUniqueSuffixJob;
use App\Models\ShortUrl;
use App\Models\ShortUrlSuffix;
use App\Models\ShortUrlSuffixRequest;

it('generates the correct number of suffixes', function (): void {
    $shortUrl = ShortUrl::factory()->create(['is_enabled' => true]);
    $suffixRequest = ShortUrlSuffixRequest::factory()->create([
        'quantity' => 5,
        'short_url_id' => $shortUrl->id,
    ]);

    GenerateRandomUniqueSuffixJob::dispatchSync($shortUrl->id, $suffixRequest->id);

    expect(ShortUrlSuffix::where('short_url_id', $shortUrl->id)->count())->toBe(5);
});

it('deletes the ShortUrlSuffixRequest after completion', function (): void {
    $shortUrl = ShortUrl::factory()->create(['is_enabled' => true]);
    $suffixRequest = ShortUrlSuffixRequest::factory()->create([
        'quantity' => 3,
        'short_url_id' => $shortUrl->id,
    ]);

    GenerateRandomUniqueSuffixJob::dispatchSync($shortUrl->id, $suffixRequest->id);

    $this->assertModelMissing($suffixRequest);
});

it('assigns the correct batch_uuid to generated suffixes', function (): void {
    $shortUrl = ShortUrl::factory()->create(['is_enabled' => true]);
    $suffixRequest = ShortUrlSuffixRequest::factory()->create([
        'quantity' => 3,
        'short_url_id' => $shortUrl->id,
    ]);

    GenerateRandomUniqueSuffixJob::dispatchSync($shortUrl->id, $suffixRequest->id);

    $suffixes = ShortUrlSuffix::where('short_url_id', $shortUrl->id)->get();

    foreach ($suffixes as $suffix) {
        expect($suffix->batch_uuid)->toBe($suffixRequest->batch_uuid);
    }
});

it('generates unique slugs for each suffix', function (): void {
    $shortUrl = ShortUrl::factory()->create(['is_enabled' => true]);
    $suffixRequest = ShortUrlSuffixRequest::factory()->create([
        'quantity' => 10,
        'short_url_id' => $shortUrl->id,
    ]);

    GenerateRandomUniqueSuffixJob::dispatchSync($shortUrl->id, $suffixRequest->id);

    $slugs = ShortUrlSuffix::where('short_url_id', $shortUrl->id)->pluck('slug')->toArray();

    expect(count($slugs))->toBe(10)
        ->and(array_unique($slugs))->toHaveCount(10);
});

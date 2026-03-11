<?php

declare(strict_types=1);

use App\Services\ShortUrl\ShortUrlSuffixService;

// --- intToBase61 ---

it('converts integers to base61 correctly', function (): void {
    $service = new ShortUrlSuffixService;

    // 1 -> 'b' (index 1 in 'abcdef...')
    expect($service->intToBase61(1, 4))->toBe('aaab');
    // 26 -> 'A' (index 26)
    expect($service->intToBase61(26, 4))->toBe('aaaA');
    // 52 -> '1' (index 52, since '0' is excluded)
    expect($service->intToBase61(52, 4))->toBe('aaa1');
});

it('pads result with letter a to the specified length', function (): void {
    $service = new ShortUrlSuffixService;

    $suffix = $service->intToBase61(1, 6);

    expect($suffix)->toBe('aaaaab')
        ->and($suffix)->toHaveLength(6);
});

it('generates suffixes that never contain zero', function (): void {
    $service = new ShortUrlSuffixService;

    for ($i = 1; $i <= 200; $i++) {
        $suffix = $service->intToBase61($i, 4);
        expect($suffix)->not->toContain('0');
    }
});

it('generates suffixes that never start with zero for GA4 compatibility', function (): void {
    $service = new ShortUrlSuffixService;

    for ($i = 1; $i <= 200; $i++) {
        $suffix = $service->intToBase61($i, 4);
        expect($suffix)->not->toStartWith('0');
    }
});

// --- calculateMinimumLength ---

it('calculates minimum length of 1 for small quantities', function (): void {
    $service = new ShortUrlSuffixService;

    expect($service->calculateMinimumLength(0))->toBe(1);
    expect($service->calculateMinimumLength(1))->toBe(1);
    expect($service->calculateMinimumLength(60))->toBe(1);
});

it('calculates minimum length of 2 for quantities above 60', function (): void {
    $service = new ShortUrlSuffixService;

    // ceil(log(60+1, 61)) = ceil(1.0) = 1 => length 1 for maxNumber=60
    // ceil(log(61+1, 61)) = ceil(1.005...) = 2 => length 2 for maxNumber=61
    expect($service->calculateMinimumLength(61))->toBe(2);
    expect($service->calculateMinimumLength(100))->toBe(2);
    expect($service->calculateMinimumLength(3720))->toBe(2);
});

it('calculates minimum length of 3 for larger quantities', function (): void {
    $service = new ShortUrlSuffixService;

    // 61^3 = 226981
    expect($service->calculateMinimumLength(3722))->toBe(3);
    expect($service->calculateMinimumLength(100000))->toBe(3);
});

// --- generateRandomUniqueSuffixes ---

it('generates the correct number of unique suffixes', function (): void {
    $service = new ShortUrlSuffixService;

    $shortUrl = \App\Models\ShortUrl::factory()->create();

    $batchUuid = (string) \Illuminate\Support\Str::uuid();
    $suffixes = $service->generateRandomUniqueSuffixes($shortUrl, 5, $batchUuid, 4);

    expect(count($suffixes))->toBe(5)
        ->and(array_unique($suffixes))->toBe($suffixes);
});

it('generates suffixes with the specified string length', function (): void {
    $service = new ShortUrlSuffixService;

    $shortUrl = \App\Models\ShortUrl::factory()->create();

    $stringLen = 6;
    $batchUuid = (string) \Illuminate\Support\Str::uuid();
    $suffixes = $service->generateRandomUniqueSuffixes($shortUrl, 3, $batchUuid, $stringLen);

    foreach ($suffixes as $suffix) {
        expect(strlen($suffix))->toBe($stringLen);
    }
});

it('inserts suffix rows into the database', function (): void {
    $service = new ShortUrlSuffixService;

    $shortUrl = \App\Models\ShortUrl::factory()->create();

    $batchUuid = (string) \Illuminate\Support\Str::uuid();
    $service->generateRandomUniqueSuffixes($shortUrl, 7, $batchUuid, 4);

    $count = \App\Models\ShortUrlSuffix::where('short_url_id', $shortUrl->id)->count();
    expect($count)->toBe(7);
});

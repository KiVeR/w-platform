<?php

declare(strict_types=1);

use App\Services\AI\Drivers\StubDriver;

it('returns a valid design response', function (): void {
    $driver = new StubDriver;

    $result = $driver->generate('system prompt', [
        ['role' => 'user', 'content' => 'Create a bakery page'],
    ]);

    expect($result)
        ->toHaveKeys(['content', 'usage'])
        ->and($result['content'])->toContain('---JSON---')
        ->and($result['usage'])->toHaveKeys(['input_tokens', 'output_tokens'])
        ->and($result['usage']['input_tokens'])->toBeInt()
        ->and($result['usage']['output_tokens'])->toBeInt();
});

it('returns parseable JSON in the content', function (): void {
    $driver = new StubDriver;

    $result = $driver->generate('system prompt', [
        ['role' => 'user', 'content' => 'anything'],
    ]);

    $parts = explode('---JSON---', $result['content'], 2);

    expect($parts)->toHaveCount(2);

    $json = json_decode(trim($parts[1]), true);

    expect($json)
        ->toBeArray()
        ->toHaveKeys(['version', 'globalStyles', 'widgets'])
        ->and($json['version'])->toBe('1.0')
        ->and($json['widgets'])->toBeArray()->not->toBeEmpty();
});

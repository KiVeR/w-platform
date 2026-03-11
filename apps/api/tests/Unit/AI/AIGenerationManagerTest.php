<?php

declare(strict_types=1);

use App\Services\AI\AIGenerationManager;
use App\Services\AI\Drivers\ClaudeDriver;
use App\Services\AI\Drivers\OpenAICompatibleDriver;
use App\Services\AI\Drivers\StubDriver;

it('resolves stub driver by default in tests', function (): void {
    $manager = app(AIGenerationManager::class);

    $driver = $manager->driver();

    expect($driver)->toBeInstanceOf(StubDriver::class);
});

it('creates claude driver', function (): void {
    config()->set('ai.drivers.claude', [
        'api_key' => 'test-key',
        'model' => 'claude-sonnet-4-5-20250929',
        'max_tokens' => 8192,
        'temperature' => 0.7,
        'timeout' => 120,
    ]);

    $manager = app(AIGenerationManager::class);

    $driver = $manager->driver('claude');

    expect($driver)->toBeInstanceOf(ClaudeDriver::class);
});

it('creates openai driver', function (): void {
    config()->set('ai.drivers.openai', [
        'api_key' => 'test-key',
        'model' => 'gpt-4o',
        'base_url' => 'https://api.openai.com/v1',
        'timeout' => 120,
        'headers' => [],
        'supports_vision' => true,
        'image_detail' => 'auto',
        'json_mode' => false,
        'is_ollama' => false,
        'provider_name' => 'OpenAI',
    ]);

    $manager = app(AIGenerationManager::class);

    $driver = $manager->driver('openai');

    expect($driver)->toBeInstanceOf(OpenAICompatibleDriver::class);
});

it('creates groq driver', function (): void {
    config()->set('ai.drivers.groq', [
        'api_key' => 'test-key',
        'model' => 'llama-3.3-70b-versatile',
        'base_url' => 'https://api.groq.com/openai/v1',
        'timeout' => 120,
        'headers' => [],
        'supports_vision' => false,
        'image_detail' => 'auto',
        'json_mode' => true,
        'is_ollama' => false,
        'provider_name' => 'Groq',
    ]);

    $manager = app(AIGenerationManager::class);

    $driver = $manager->driver('groq');

    expect($driver)->toBeInstanceOf(OpenAICompatibleDriver::class);
});

it('reads default driver from config', function (): void {
    config()->set('ai.default', 'stub');

    $manager = app(AIGenerationManager::class);

    expect($manager->getDefaultDriver())->toBe('stub');
});

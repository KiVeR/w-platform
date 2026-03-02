<?php

declare(strict_types=1);

use App\Jobs\AI\GenerateDesignJob;
use App\Services\AI\AIGenerationManager;
use Illuminate\Support\Facades\Cache;

it('stores completed result in cache on success', function (): void {
    $jobId = 'test-job-id-1';
    $job = new GenerateDesignJob(
        jobId: $jobId,
        prompt: 'Create a bakery landing page',
        userId: 1,
    );

    $job->handle(app(AIGenerationManager::class));

    $result = Cache::get("ai-job:{$jobId}");

    expect($result)
        ->toBeArray()
        ->and($result['status'])->toBe('completed')
        ->and($result['design'])->toBeArray()
        ->and($result['design']['version'])->toBe('1.0')
        ->and($result['design']['widgets'])->toBeArray()->not->toBeEmpty()
        ->and($result['usage'])->toBeArray()
        ->and($result['usage']['input_tokens'])->toBeInt()
        ->and($result['usage']['output_tokens'])->toBeInt();
});

it('stores failed result in cache on error', function (): void {
    $jobId = 'test-job-id-2';
    $job = new GenerateDesignJob(
        jobId: $jobId,
        prompt: 'Create something',
        userId: 1,
    );

    // Use a mock manager that throws
    $mockManager = Mockery::mock(AIGenerationManager::class);
    $mockManager->shouldReceive('driver')
        ->andThrow(new RuntimeException('API is down'));

    $job->handle($mockManager);

    $result = Cache::get("ai-job:{$jobId}");

    expect($result)
        ->toBeArray()
        ->and($result['status'])->toBe('failed')
        ->and($result['error'])->toBe('API is down');
});

it('includes conversation history in messages', function (): void {
    $jobId = 'test-job-id-3';
    $job = new GenerateDesignJob(
        jobId: $jobId,
        prompt: 'Make it blue',
        userId: 1,
        conversationHistory: [
            ['role' => 'user', 'content' => 'Create a bakery page'],
            ['role' => 'assistant', 'content' => 'Here is the design...'],
        ],
    );

    $job->handle(app(AIGenerationManager::class));

    $result = Cache::get("ai-job:{$jobId}");

    expect($result['status'])->toBe('completed');
});

it('uses ai-generation queue by default', function (): void {
    $job = new GenerateDesignJob(
        jobId: 'test-job-id-4',
        prompt: 'Create a page',
        userId: 1,
    );

    expect($job->queue)->toBe('ai-generation');
});

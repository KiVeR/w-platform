<?php

declare(strict_types=1);

namespace App\Jobs\AI;

use App\Services\AI\AIGenerationManager;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GenerateDesignJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    /**
     * @param  array<int, array{role: string, content: string}>  $conversationHistory
     * @param  array{data: string, mime_type: string}|null  $image
     */
    public function __construct(
        public readonly string $jobId,
        public readonly string $prompt,
        public readonly int $userId,
        public readonly ?array $image = null,
        public readonly array $conversationHistory = [],
    ) {
        $this->onQueue((string) config('ai.job.queue', 'ai-generation'));
    }

    public function handle(AIGenerationManager $manager): void
    {
        $cacheKey = "ai-job:{$this->jobId}";

        try {
            $systemPrompt = $this->loadSystemPrompt();
            $messages = $this->buildMessages();

            /** @var \App\Contracts\AIDriverInterface $driver */
            $driver = $manager->driver();
            $result = $driver->generate($systemPrompt, $messages);

            $design = $this->parseDesignFromResponse($result['content']);

            /** @var int $ttl */
            $ttl = config('ai.job.cache_ttl', 3600);

            Cache::put($cacheKey, [
                'status' => 'completed',
                'design' => $design,
                'description' => $this->extractDescription($result['content']),
                'usage' => $result['usage'],
            ], $ttl);
        } catch (\Throwable $e) {
            Log::error('AI generation failed', [
                'job_id' => $this->jobId,
                'user_id' => $this->userId,
                'error' => $e->getMessage(),
            ]);

            /** @var int $ttl */
            $ttl = config('ai.job.cache_ttl', 3600);

            Cache::put($cacheKey, [
                'status' => 'failed',
                'error' => $e->getMessage(),
            ], $ttl);
        }
    }

    private function loadSystemPrompt(): string
    {
        $promptPath = resource_path('prompts/design-generation.md');

        if (file_exists($promptPath)) {
            return (string) file_get_contents($promptPath);
        }

        return 'You are a UI designer. Generate a valid DesignDocument JSON.';
    }

    /**
     * @return array<int, array{role: string, content: string|array<int, mixed>}>
     */
    private function buildMessages(): array
    {
        $messages = [];

        // Add conversation history
        foreach ($this->conversationHistory as $historyMessage) {
            $messages[] = [
                'role' => $historyMessage['role'],
                'content' => $historyMessage['content'],
            ];
        }

        // Build the user message
        if ($this->image !== null) {
            $messages[] = [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'image',
                        'source' => [
                            'type' => 'base64',
                            'media_type' => $this->image['mime_type'],
                            'data' => $this->image['data'],
                        ],
                    ],
                    [
                        'type' => 'text',
                        'text' => $this->buildUserPrompt(hasImage: true),
                    ],
                ],
            ];
        } else {
            $messages[] = [
                'role' => 'user',
                'content' => $this->buildUserPrompt(hasImage: false),
            ];
        }

        return $messages;
    }

    private function buildUserPrompt(bool $hasImage): string
    {
        if ($hasImage) {
            return "Based on the image provided and this request: \"{$this->prompt}\"\n\nGenerate a DesignDocument JSON that recreates this design using Kreo widgets. Adapt the layout to work with Kreo's row/column system.\n\nRemember: Brief French description, then ---JSON---, then pure JSON starting with { and ending with }.";
        }

        return "User request: \"{$this->prompt}\"\n\nGenerate a DesignDocument JSON that fulfills this request using Kreo widgets.\n\nRemember: Brief French description, then ---JSON---, then pure JSON starting with { and ending with }.";
    }

    /**
     * Parse the design JSON from the AI response.
     *
     * @return array<string, mixed>|null
     */
    private function parseDesignFromResponse(string $response): ?array
    {
        // Look for ---JSON--- separator
        $parts = preg_split('/---JSON---/', $response, 2);

        if ($parts === false || count($parts) < 2) {
            // Try to find JSON directly
            return $this->extractJsonFromString($response);
        }

        $jsonString = trim($parts[1]);

        return $this->extractJsonFromString($jsonString);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function extractJsonFromString(string $input): ?array
    {
        // Remove markdown code blocks if present
        $cleaned = preg_replace('/```json\s*/i', '', $input) ?? $input;
        $cleaned = preg_replace('/```\s*$/', '', $cleaned) ?? $cleaned;
        $cleaned = trim($cleaned);

        // Find the first { and last }
        $start = strpos($cleaned, '{');
        $end = strrpos($cleaned, '}');

        if ($start === false || $end === false) {
            return null;
        }

        $jsonString = substr($cleaned, $start, $end - $start + 1);

        /** @var array<string, mixed>|null $decoded */
        $decoded = json_decode($jsonString, true);

        return $decoded;
    }

    private function extractDescription(string $response): string
    {
        $parts = preg_split('/---JSON---/', $response, 2);

        if ($parts !== false && count($parts) >= 2) {
            return trim($parts[0]);
        }

        return '';
    }
}

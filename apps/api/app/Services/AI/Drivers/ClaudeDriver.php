<?php

declare(strict_types=1);

namespace App\Services\AI\Drivers;

use App\Contracts\AIDriverInterface;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ClaudeDriver implements AIDriverInterface
{
    private const API_URL = 'https://api.anthropic.com/v1/messages';

    private const API_VERSION = '2023-06-01';

    /**
     * @param  array{api_key: string, model: string, max_tokens: int, temperature: float, timeout: int}  $config
     */
    public function __construct(
        private readonly array $config,
    ) {}

    public function generate(string $systemPrompt, array $messages, array $options = []): array
    {
        $model = $options['model'] ?? $this->config['model'];
        $maxTokens = $options['max_tokens'] ?? $this->config['max_tokens'];
        $temperature = $options['temperature'] ?? $this->config['temperature'];

        $response = Http::withHeaders([
            'x-api-key' => $this->config['api_key'],
            'anthropic-version' => self::API_VERSION,
            'content-type' => 'application/json',
        ])
            ->timeout($this->config['timeout'])
            ->post(self::API_URL, [
                'model' => $model,
                'max_tokens' => $maxTokens,
                'temperature' => $temperature,
                'system' => $systemPrompt,
                'messages' => $this->formatMessages($messages),
            ]);

        if ($response->failed()) {
            $this->handleError($response->status(), $response->body());
        }

        /** @var array<string, mixed> $data */
        $data = $response->json();

        /** @var array<int, array{type: string, text?: string}> $contentBlocks */
        $contentBlocks = $data['content'] ?? [];

        $content = collect($contentBlocks)
            ->where('type', 'text')
            ->pluck('text')
            ->implode('');

        /** @var array{input_tokens?: int, output_tokens?: int} $usage */
        $usage = $data['usage'] ?? [];

        return [
            'content' => $content,
            'usage' => [
                'input_tokens' => $usage['input_tokens'] ?? 0,
                'output_tokens' => $usage['output_tokens'] ?? 0,
            ],
        ];
    }

    /**
     * Format messages for the Anthropic API.
     *
     * @param  array<int, array{role: string, content: string|array<int, mixed>}>  $messages
     * @return array<int, array{role: string, content: string|array<int, mixed>}>
     */
    private function formatMessages(array $messages): array
    {
        return array_map(function (array $message): array {
            if (is_string($message['content'])) {
                return [
                    'role' => $message['role'],
                    'content' => $message['content'],
                ];
            }

            // Content blocks (text + images)
            return [
                'role' => $message['role'],
                'content' => $message['content'],
            ];
        }, $messages);
    }

    private function handleError(int $status, string $body): never
    {
        $message = match (true) {
            $status === 429 => 'AI rate limit exceeded. Please try again later.',
            $status === 401 => 'Invalid AI API key.',
            $status === 400 => "AI request error: {$body}",
            $status >= 500 => 'AI service temporarily unavailable.',
            default => "AI request failed (HTTP {$status}): {$body}",
        };

        throw new RuntimeException($message);
    }
}

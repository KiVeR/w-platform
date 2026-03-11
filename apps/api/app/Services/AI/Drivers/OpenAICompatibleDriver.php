<?php

declare(strict_types=1);

namespace App\Services\AI\Drivers;

use App\Contracts\AIDriverInterface;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAICompatibleDriver implements AIDriverInterface
{
    private const DEFAULT_MAX_TOKENS = 8192;

    private const DEFAULT_TEMPERATURE = 0.7;

    /**
     * @param  array{api_key: string, model: string, base_url: string, timeout: int, headers: array<string, string>, supports_vision: bool, image_detail: string, json_mode: bool, is_ollama: bool, provider_name: string}  $config
     */
    public function __construct(
        private readonly array $config,
    ) {}

    public function generate(string $systemPrompt, array $messages, array $options = []): array
    {
        $model = $options['model'] ?? $this->config['model'];
        $maxTokens = $options['max_tokens'] ?? self::DEFAULT_MAX_TOKENS;
        $temperature = $options['temperature'] ?? self::DEFAULT_TEMPERATURE;

        $payload = [
            'model' => $model,
            'max_tokens' => $maxTokens,
            'temperature' => $temperature,
            'messages' => $this->formatMessages($systemPrompt, $messages),
        ];

        // JSON mode support
        if ($this->config['json_mode']) {
            if ($this->config['is_ollama']) {
                $payload['format'] = 'json';
            } else {
                $payload['response_format'] = ['type' => 'json_object'];
            }
        }

        $headers = array_merge(
            [
                'Authorization' => "Bearer {$this->config['api_key']}",
                'Content-Type' => 'application/json',
            ],
            $this->config['headers'],
        );

        $baseUrl = rtrim($this->config['base_url'], '/');

        $response = Http::withHeaders($headers)
            ->timeout($this->config['timeout'])
            ->post("{$baseUrl}/chat/completions", $payload);

        if ($response->failed()) {
            $this->handleError($response->status(), $response->body());
        }

        /** @var array{choices: array<int, array{message: array{content: string}}>, usage?: array{prompt_tokens?: int, completion_tokens?: int}} $data */
        $data = $response->json();

        $content = $data['choices'][0]['message']['content'] ?? '';

        return [
            'content' => $content,
            'usage' => [
                'input_tokens' => $data['usage']['prompt_tokens'] ?? 0,
                'output_tokens' => $data['usage']['completion_tokens'] ?? 0,
            ],
        ];
    }

    /**
     * Format messages for the OpenAI chat completions API.
     *
     * @param  array<int, array{role: string, content: string|array<int, mixed>}>  $messages
     * @return array<int, array{role: string, content: string|array<int, mixed>}>
     */
    private function formatMessages(string $systemPrompt, array $messages): array
    {
        $formatted = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        foreach ($messages as $message) {
            $formatted[] = [
                'role' => $message['role'],
                'content' => $message['content'],
            ];
        }

        return $formatted;
    }

    private function handleError(int $status, string $body): never
    {
        $provider = $this->config['provider_name'];

        $message = match (true) {
            $status === 429 => "{$provider}: rate limit exceeded. Please try again later.",
            $status === 401 => "{$provider}: invalid API key.",
            $status === 404 => "{$provider}: model not found.",
            $status === 400 => "{$provider}: bad request — {$body}",
            $status >= 500 => "{$provider}: service temporarily unavailable.",
            default => "{$provider}: request failed (HTTP {$status}): {$body}",
        };

        throw new RuntimeException($message);
    }
}

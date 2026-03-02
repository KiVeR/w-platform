<?php

declare(strict_types=1);

namespace App\Contracts;

interface AIDriverInterface
{
    /**
     * Generate a response from the AI model.
     *
     * @param  string  $systemPrompt  The system prompt to guide the AI
     * @param  array<int, array{role: string, content: string|array<int, mixed>}>  $messages  The conversation messages
     * @param  array{max_tokens?: int, temperature?: float, model?: string}  $options  Additional options
     * @return array{content: string, usage: array{input_tokens: int, output_tokens: int}}
     */
    public function generate(string $systemPrompt, array $messages, array $options = []): array;
}

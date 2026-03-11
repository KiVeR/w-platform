<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Contracts\AIDriverInterface;
use App\Services\AI\Drivers\ClaudeDriver;
use App\Services\AI\Drivers\OpenAICompatibleDriver;
use App\Services\AI\Drivers\StubDriver;
use Illuminate\Support\Manager;

/**
 * @method AIDriverInterface driver(?string $driver = null)
 */
class AIGenerationManager extends Manager
{
    public function getDefaultDriver(): string
    {
        /** @var string */
        return $this->config->get('ai.default', 'stub');
    }

    protected function createStubDriver(): StubDriver
    {
        return new StubDriver;
    }

    protected function createClaudeDriver(): ClaudeDriver
    {
        /** @var array{api_key: string, model: string, max_tokens: int, temperature: float, timeout: int} $config */
        $config = $this->config->get('ai.drivers.claude', []);

        return new ClaudeDriver($config);
    }

    protected function createOpenaiDriver(): OpenAICompatibleDriver
    {
        return $this->createOpenAICompatibleDriver('openai');
    }

    protected function createGroqDriver(): OpenAICompatibleDriver
    {
        return $this->createOpenAICompatibleDriver('groq');
    }

    protected function createTogetherDriver(): OpenAICompatibleDriver
    {
        return $this->createOpenAICompatibleDriver('together');
    }

    protected function createMistralDriver(): OpenAICompatibleDriver
    {
        return $this->createOpenAICompatibleDriver('mistral');
    }

    protected function createOllamaDriver(): OpenAICompatibleDriver
    {
        return $this->createOpenAICompatibleDriver('ollama');
    }

    private function createOpenAICompatibleDriver(string $provider): OpenAICompatibleDriver
    {
        /** @var array{api_key: string, model: string, base_url: string, timeout: int, headers: array<string, string>, supports_vision: bool, image_detail: string, json_mode: bool, is_ollama: bool, provider_name: string} $config */
        $config = $this->config->get("ai.drivers.{$provider}", []);

        return new OpenAICompatibleDriver($config);
    }
}

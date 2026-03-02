<?php

declare(strict_types=1);

return [
    'default' => env('AI_DRIVER', 'claude'),

    'drivers' => [
        'stub' => [],

        'claude' => [
            'api_key' => env('ANTHROPIC_API_KEY', ''),
            'model' => env('AI_CLAUDE_MODEL', 'claude-sonnet-4-5-20250929'),
            'max_tokens' => (int) env('AI_MAX_TOKENS', 8192),
            'temperature' => (float) env('AI_TEMPERATURE', 0.7),
            'timeout' => (int) env('AI_TIMEOUT', 120),
        ],

        'openai' => [
            'api_key' => env('OPENAI_API_KEY', ''),
            'model' => env('AI_OPENAI_MODEL', 'gpt-4o'),
            'base_url' => 'https://api.openai.com/v1',
            'timeout' => (int) env('AI_TIMEOUT', 120),
            'headers' => [],
            'supports_vision' => true,
            'image_detail' => 'auto',
            'json_mode' => false,
            'is_ollama' => false,
            'provider_name' => 'OpenAI',
        ],

        'groq' => [
            'api_key' => env('GROQ_API_KEY', ''),
            'model' => env('AI_GROQ_MODEL', 'llama-3.3-70b-versatile'),
            'base_url' => 'https://api.groq.com/openai/v1',
            'timeout' => (int) env('AI_TIMEOUT', 120),
            'headers' => [],
            'supports_vision' => false,
            'image_detail' => 'auto',
            'json_mode' => true,
            'is_ollama' => false,
            'provider_name' => 'Groq',
        ],

        'together' => [
            'api_key' => env('TOGETHER_API_KEY', ''),
            'model' => env('AI_TOGETHER_MODEL', 'meta-llama/Llama-3.3-70B-Instruct-Turbo'),
            'base_url' => 'https://api.together.xyz/v1',
            'timeout' => (int) env('AI_TIMEOUT', 120),
            'headers' => [],
            'supports_vision' => false,
            'image_detail' => 'auto',
            'json_mode' => true,
            'is_ollama' => false,
            'provider_name' => 'Together',
        ],

        'mistral' => [
            'api_key' => env('MISTRAL_API_KEY', ''),
            'model' => env('AI_MISTRAL_MODEL', 'mistral-large-latest'),
            'base_url' => 'https://api.mistral.ai/v1',
            'timeout' => (int) env('AI_TIMEOUT', 120),
            'headers' => [],
            'supports_vision' => false,
            'image_detail' => 'auto',
            'json_mode' => true,
            'is_ollama' => false,
            'provider_name' => 'Mistral',
        ],

        'ollama' => [
            'api_key' => 'ollama',
            'model' => env('AI_OLLAMA_MODEL', 'llama3.1'),
            'base_url' => env('AI_OLLAMA_URL', 'http://localhost:11434/v1'),
            'timeout' => (int) env('AI_TIMEOUT', 300),
            'headers' => [],
            'supports_vision' => false,
            'image_detail' => 'auto',
            'json_mode' => true,
            'is_ollama' => true,
            'provider_name' => 'Ollama',
        ],
    ],

    'job' => [
        'queue' => env('AI_QUEUE', 'ai-generation'),
        'timeout' => (int) env('AI_JOB_TIMEOUT', 300),
        'cache_ttl' => (int) env('AI_CACHE_TTL', 3600), // 1 hour
    ],

    'quota_by_role' => [
        'merchant' => 20,
        'partner' => 100,
        'admin' => 100,
    ],
];

<?php

declare(strict_types=1);

namespace App\Services\AI\Drivers;

use App\Contracts\AIDriverInterface;

class StubDriver implements AIDriverInterface
{
    public function generate(string $systemPrompt, array $messages, array $options = []): array
    {
        $design = [
            'version' => '1.0',
            'globalStyles' => [
                'backgroundColor' => '#ffffff',
                'textColor' => '#1e293b',
                'primaryColor' => '#3b82f6',
                'fontFamily' => 'DM Sans, sans-serif',
                'headingFontFamily' => 'DM Serif Display, serif',
                'contentPadding' => '16px',
            ],
            'widgets' => [
                [
                    'id' => 'widget_1',
                    'type' => 'title',
                    'order' => 0,
                    'content' => ['text' => 'Page de test'],
                    'styles' => ['fontSize' => '32px', 'textAlign' => 'center'],
                ],
                [
                    'id' => 'widget_2',
                    'type' => 'text',
                    'order' => 1,
                    'content' => ['text' => 'Ceci est un design de test.'],
                    'styles' => ['textAlign' => 'center', 'padding' => '16px'],
                ],
                [
                    'id' => 'widget_3',
                    'type' => 'button',
                    'order' => 2,
                    'content' => ['text' => 'Découvrir', 'action' => 'link', 'href' => '/'],
                    'styles' => ['backgroundColor' => '#3b82f6', 'color' => '#ffffff', 'padding' => '16px 32px'],
                ],
            ],
        ];

        $content = "Je crée un design de test avec un titre, un texte et un bouton.\n---JSON---\n".json_encode($design, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        return [
            'content' => $content,
            'usage' => [
                'input_tokens' => 100,
                'output_tokens' => 200,
            ],
        ];
    }
}

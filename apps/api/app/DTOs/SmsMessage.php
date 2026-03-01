<?php

declare(strict_types=1);

namespace App\DTOs;

readonly class SmsMessage
{
    public function __construct(
        public string $content,
        public ?string $contentWithStop = null,
    ) {}

    public function getContentWithStop(): string
    {
        return $this->contentWithStop ?? $this->content;
    }
}

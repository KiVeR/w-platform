<?php

declare(strict_types=1);

namespace App\DTOs;

readonly class SendResult
{
    public function __construct(
        public bool $success,
        public ?string $externalId = null,
        public ?string $error = null,
    ) {}
}

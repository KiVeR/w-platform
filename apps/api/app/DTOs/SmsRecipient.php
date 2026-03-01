<?php

declare(strict_types=1);

namespace App\DTOs;

readonly class SmsRecipient
{
    public function __construct(
        public string $phoneNumber,
        public ?string $messagePreview = null,
        public ?string $uuid = null,
    ) {}
}

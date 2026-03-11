<?php

declare(strict_types=1);

namespace App\Contracts;

use App\DTOs\SmsMessage;
use App\DTOs\SmsRecipient;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Collection;

interface SmsRoutingDriverInterface
{
    public const string STOP_NUMBER = '12345';

    public function batchUuid(string $batchUuid): self;

    /** @param Collection<int, SmsRecipient> $recipients */
    public function to(Collection $recipients): self;

    public function from(string $from): self;

    public function message(SmsMessage $message): self;

    public function send(): Response;

    public function checkRequiredValues(): void;
}

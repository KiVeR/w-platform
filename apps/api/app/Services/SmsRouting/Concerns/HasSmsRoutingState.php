<?php

declare(strict_types=1);

namespace App\Services\SmsRouting\Concerns;

use App\DTOs\SmsMessage;
use App\DTOs\SmsRecipient;
use Illuminate\Support\Collection;

trait HasSmsRoutingState
{
    protected ?string $batchUuidValue = null;

    /** @var Collection<int, SmsRecipient>|null */
    protected ?Collection $recipients = null;

    protected ?string $fromValue = null;

    protected ?SmsMessage $smsMessage = null;

    public function batchUuid(string $batchUuid): self
    {
        $this->batchUuidValue = $batchUuid;

        return $this;
    }

    /** @param Collection<int, SmsRecipient> $recipients */
    public function to(Collection $recipients): self
    {
        $this->recipients = $recipients;

        return $this;
    }

    public function from(string $from): self
    {
        $this->fromValue = $from;

        return $this;
    }

    public function message(SmsMessage $message): self
    {
        $this->smsMessage = $message;

        return $this;
    }
}

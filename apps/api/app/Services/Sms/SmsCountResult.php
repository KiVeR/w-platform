<?php

declare(strict_types=1);

namespace App\Services\Sms;

use App\Enums\SmsEncoding;

/**
 * Value object representing the result of an SMS character count.
 */
final readonly class SmsCountResult
{
    public function __construct(
        /**
         * The detected encoding of the message.
         */
        public SmsEncoding $encoding,

        /**
         * Total character count (including weight 2 for extended GSM chars).
         */
        public int $length,

        /**
         * Number of SMS messages needed.
         */
        public int $messages,

        /**
         * Character limit per message (depends on encoding and multipart).
         */
        public int $perMessage,

        /**
         * Remaining characters in the last SMS.
         */
        public int $remaining,
    ) {}

    /**
     * Check if the message requires multipart SMS.
     */
    public function isMultipart(): bool
    {
        return $this->messages > 1;
    }

    /**
     * Check if the message uses UTF-16 encoding.
     */
    public function isUtf16(): bool
    {
        return $this->encoding === SmsEncoding::UTF16;
    }

    /**
     * Check if the message uses GSM-7 compatible encoding.
     */
    public function isGsmCompatible(): bool
    {
        return $this->encoding !== SmsEncoding::UTF16;
    }

    /**
     * Check if the message uses extended GSM characters.
     */
    public function hasExtendedChars(): bool
    {
        return $this->encoding === SmsEncoding::GSM_7BIT_EX;
    }

    /**
     * Convert to array representation.
     *
     * @return array{encoding: string, length: int, messages: int, per_message: int, remaining: int}
     */
    public function toArray(): array
    {
        return [
            'encoding' => $this->encoding->value,
            'length' => $this->length,
            'messages' => $this->messages,
            'per_message' => $this->perMessage,
            'remaining' => $this->remaining,
        ];
    }
}

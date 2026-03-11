<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * SMS encoding types with their character limits.
 */
enum SmsEncoding: string
{
    case GSM_7BIT = 'GSM_7BIT';
    case GSM_7BIT_EX = 'GSM_7BIT_EX';
    case UTF16 = 'UTF16';

    /**
     * Get the single message character limit for this encoding.
     */
    public function singleLimit(): int
    {
        return match ($this) {
            self::GSM_7BIT, self::GSM_7BIT_EX => 160,
            self::UTF16 => 70,
        };
    }

    /**
     * Get the multipart message character limit for this encoding.
     */
    public function multipartLimit(): int
    {
        return match ($this) {
            self::GSM_7BIT, self::GSM_7BIT_EX => 153,
            self::UTF16 => 67,
        };
    }

    /**
     * Check if this encoding uses extended characters (weight 2).
     */
    public function hasExtendedChars(): bool
    {
        return $this === self::GSM_7BIT_EX;
    }

    /**
     * Check if this encoding is Unicode/UTF-16.
     */
    public function isUnicode(): bool
    {
        return $this === self::UTF16;
    }
}

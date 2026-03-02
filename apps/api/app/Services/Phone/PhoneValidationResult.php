<?php

declare(strict_types=1);

namespace App\Services\Phone;

/**
 * Value object representing the result of phone number validation.
 */
final readonly class PhoneValidationResult
{
    public function __construct(
        /**
         * Whether the phone number is valid.
         */
        public bool $isValid,

        /**
         * Normalized phone number in E.164 format (if valid).
         */
        public ?string $normalized,

        /**
         * Error code if validation failed.
         */
        public ?string $errorCode,

        /**
         * Human-readable error message if validation failed.
         */
        public ?string $errorMessage,

        /**
         * Whether the phone is a mobile number.
         */
        public bool $isMobile,

        /**
         * Whether the phone is from DOM-TOM (French overseas territories).
         */
        public bool $isDomTom,
    ) {}

    /**
     * Create a valid result.
     */
    public static function valid(string $normalized, bool $isMobile = true, bool $isDomTom = false): self
    {
        return new self(
            isValid: true,
            normalized: $normalized,
            errorCode: null,
            errorMessage: null,
            isMobile: $isMobile,
            isDomTom: $isDomTom,
        );
    }

    /**
     * Create an invalid result with error details.
     */
    public static function invalid(string $errorCode, string $errorMessage): self
    {
        return new self(
            isValid: false,
            normalized: null,
            errorCode: $errorCode,
            errorMessage: $errorMessage,
            isMobile: false,
            isDomTom: false,
        );
    }

    /**
     * Convert to array representation.
     *
     * @return array{is_valid: bool, normalized: ?string, error_code: ?string, error_message: ?string, is_mobile: bool, is_dom_tom: bool}
     */
    public function toArray(): array
    {
        return [
            'is_valid' => $this->isValid,
            'normalized' => $this->normalized,
            'error_code' => $this->errorCode,
            'error_message' => $this->errorMessage,
            'is_mobile' => $this->isMobile,
            'is_dom_tom' => $this->isDomTom,
        ];
    }
}

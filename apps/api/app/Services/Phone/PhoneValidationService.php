<?php

declare(strict_types=1);

namespace App\Services\Phone;

use App\Enums\PhoneFormat;
use libphonenumber\NumberParseException;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\PhoneNumberType;
use libphonenumber\PhoneNumberUtil;

/**
 * Phone number validation and sanitization service.
 *
 * Ported from:
 * - front/app/Rules/PhoneNumber.php (libphonenumber validation)
 * - admin/app/Helpers/helpers.php (cleanPhones function)
 * - legacy recipient import formatting rules (E.164 normalization)
 */
class PhoneValidationService
{
    private PhoneNumberUtil $phoneUtil;

    public function __construct()
    {
        $this->phoneUtil = PhoneNumberUtil::getInstance();
    }

    /**
     * Check if a phone number is valid.
     */
    public function isValid(string $phone, string $region = 'FR'): bool
    {
        try {
            $phoneNumber = $this->phoneUtil->parse($phone, $region);

            return $this->phoneUtil->isValidNumber($phoneNumber);
        } catch (NumberParseException) {
            return false;
        }
    }

    /**
     * Validate a phone number with detailed result.
     */
    public function validate(string $phone, string $region = 'FR'): PhoneValidationResult
    {
        // First, sanitize the phone number
        $sanitized = $this->sanitize($phone);

        if ($sanitized === '') {
            return PhoneValidationResult::invalid(
                PhoneErrorCode::INVALID_FORMAT,
                PhoneErrorCode::getMessage(PhoneErrorCode::INVALID_FORMAT)
            );
        }

        // Check length
        if (strlen($sanitized) < 10) {
            return PhoneValidationResult::invalid(
                PhoneErrorCode::TOO_SHORT,
                PhoneErrorCode::getMessage(PhoneErrorCode::TOO_SHORT)
            );
        }

        if (strlen($sanitized) > 10) {
            return PhoneValidationResult::invalid(
                PhoneErrorCode::TOO_LONG,
                PhoneErrorCode::getMessage(PhoneErrorCode::TOO_LONG)
            );
        }

        // Check if blacklisted
        if ($this->isBlacklisted($sanitized)) {
            return PhoneValidationResult::invalid(
                PhoneErrorCode::BLACKLISTED,
                PhoneErrorCode::getMessage(PhoneErrorCode::BLACKLISTED)
            );
        }

        // Check if mobile (06/07)
        $isMobile = $this->isMobile($sanitized);
        if (! $isMobile) {
            return PhoneValidationResult::invalid(
                PhoneErrorCode::NOT_MOBILE,
                PhoneErrorCode::getMessage(PhoneErrorCode::NOT_MOBILE)
            );
        }

        // Check DOM-TOM
        $isDomTom = $this->isDomTom($sanitized);

        // Try to parse and format
        try {
            $phoneNumber = $this->phoneUtil->parse($sanitized, $region);

            if (! $this->phoneUtil->isValidNumber($phoneNumber)) {
                return PhoneValidationResult::invalid(
                    PhoneErrorCode::INVALID_FORMAT,
                    PhoneErrorCode::getMessage(PhoneErrorCode::INVALID_FORMAT)
                );
            }

            $normalized = $this->phoneUtil->format($phoneNumber, PhoneNumberFormat::E164);

            return PhoneValidationResult::valid($normalized, $isMobile, $isDomTom);
        } catch (NumberParseException) {
            return PhoneValidationResult::invalid(
                PhoneErrorCode::PARSE_ERROR,
                PhoneErrorCode::getMessage(PhoneErrorCode::PARSE_ERROR)
            );
        }
    }

    /**
     * Sanitize a single phone number.
     * Cleans up formatting issues, OCR errors, and normalizes to 10 digits.
     */
    public function sanitize(string $phone): string
    {
        // Remove dots and spaces
        $phone = preg_replace('/[ .]/', '', $phone) ?? $phone;

        // Fix OCR errors: i/I/ï/î → 1
        $phone = preg_replace('/[iIïî]/', '1', $phone) ?? $phone;

        // Fix OCR errors: o/O/ô/ö/° → 0
        $phone = preg_replace('/[oOôö°]/', '0', $phone) ?? $phone;

        // Replace +33 with 0
        $phone = preg_replace('/\+33/', '0', $phone) ?? $phone;

        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone) ?? $phone;

        // Fix 33 prefix → 0
        if (str_starts_with($phone, '33')) {
            $phone = '0'.substr($phone, 2);
        }

        // Fix 340 prefix → 0
        if (str_starts_with($phone, '340')) {
            $phone = '0'.substr($phone, 3);
        }

        // Fix 9-digit numbers (add leading 0)
        if (strlen($phone) === 9) {
            $phone = '0'.$phone;
        }

        return $phone;
    }

    /**
     * Sanitize and validate multiple phone numbers from raw text.
     * Ported from cleanPhones() in admin/app/Helpers/helpers.php
     *
     * @return array<string> Array of valid, unique phone numbers
     */
    public function sanitizeMany(string $rawText): array
    {
        $cleanedPhones = [];

        // Remove dots and spaces
        $text = preg_replace('/[ .]/', '', $rawText) ?? $rawText;

        // Replace possible delimiters with comma
        $text = preg_replace('/[\n\r;%\\\\:_\-\|\/&]/', ',', $text) ?? $text;

        // Fix duplicated commas
        $text = preg_replace('/,+/', ',', rtrim($text, ',')) ?? $text;

        // Fix OCR errors
        $text = preg_replace('/[iIïî]/', '1', $text) ?? $text;
        $text = preg_replace('/[oOôö°]/', '0', $text) ?? $text;

        // Replace +33 with 0
        $text = preg_replace('/\+33/', '0', $text) ?? $text;

        // Remove non-numeric characters (except comma)
        $text = preg_replace('/[^0-9,]/', '', $text) ?? $text;

        $phones = explode(',', $text);

        foreach ($phones as $phone) {
            if ($phone === '') {
                continue;
            }

            // Fix 33 prefix
            if (str_starts_with($phone, '33')) {
                $phone = '0'.substr($phone, 2);
            }

            // Fix 340 prefix
            if (str_starts_with($phone, '340')) {
                $phone = '0'.substr($phone, 3);
            }

            // Fix 9-digit numbers
            if (strlen($phone) === 9) {
                $phone = '0'.$phone;
            }

            // Reject if not 10 digits
            if (strlen($phone) !== 10) {
                continue;
            }

            // Reject blacklisted patterns
            if ($this->isBlacklisted($phone)) {
                continue;
            }

            // Reject if not mobile (06/07)
            if (! $this->isMobile($phone)) {
                continue;
            }

            // Reject DOM-TOM
            if ($this->isDomTom($phone)) {
                continue;
            }

            $cleanedPhones[] = $phone;
        }

        return array_values(array_unique($cleanedPhones));
    }

    /**
     * Format a phone number to a specific format.
     */
    public function format(string $phone, PhoneFormat $format = PhoneFormat::E164, string $region = 'FR'): string
    {
        try {
            $phoneNumber = $this->phoneUtil->parse($phone, $region);

            $libFormat = match ($format) {
                PhoneFormat::E164 => PhoneNumberFormat::E164,
                PhoneFormat::NATIONAL => PhoneNumberFormat::NATIONAL,
                PhoneFormat::INTERNATIONAL => PhoneNumberFormat::INTERNATIONAL,
                PhoneFormat::RFC3966 => PhoneNumberFormat::RFC3966,
            };

            return $this->phoneUtil->format($phoneNumber, $libFormat);
        } catch (NumberParseException) {
            return $phone;
        }
    }

    /**
     * Check if a phone number is a mobile number (06/07 prefix).
     */
    public function isMobile(string $phone): bool
    {
        $sanitized = preg_replace('/[^0-9]/', '', $phone) ?? $phone;

        // Convert E.164 to national format
        if (str_starts_with($sanitized, '33')) {
            $sanitized = '0'.substr($sanitized, 2);
        }

        return (bool) preg_match('/^0[67]/', $sanitized);
    }

    /**
     * Check if a phone number is from DOM-TOM (French overseas territories).
     */
    public function isDomTom(string $phone): bool
    {
        $sanitized = preg_replace('/[^0-9]/', '', $phone) ?? $phone;

        // Convert E.164 to national format
        if (str_starts_with($sanitized, '33')) {
            $sanitized = '0'.substr($sanitized, 2);
        }

        /** @var array<string> $prefixes */
        $prefixes = config('phone.domtom_prefixes', ['0692', '0690', '0694', '0696']);

        foreach ($prefixes as $prefix) {
            if (str_starts_with($sanitized, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a phone number matches blacklist patterns.
     */
    public function isBlacklisted(string $phone): bool
    {
        $sanitized = preg_replace('/[^0-9]/', '', $phone) ?? $phone;

        /** @var array<string> $patterns */
        $patterns = config('phone.blacklist_patterns', []);

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $sanitized) === 1) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get the phone type (mobile, fixed line, etc.).
     */
    public function getType(string $phone, string $region = 'FR'): ?string
    {
        try {
            $phoneNumber = $this->phoneUtil->parse($phone, $region);
            $type = $this->phoneUtil->getNumberType($phoneNumber);

            return match ($type) {
                PhoneNumberType::MOBILE => 'mobile',
                PhoneNumberType::FIXED_LINE => 'fixed_line',
                PhoneNumberType::FIXED_LINE_OR_MOBILE => 'fixed_line_or_mobile',
                PhoneNumberType::TOLL_FREE => 'toll_free',
                PhoneNumberType::PREMIUM_RATE => 'premium_rate',
                PhoneNumberType::SHARED_COST => 'shared_cost',
                PhoneNumberType::VOIP => 'voip',
                PhoneNumberType::PERSONAL_NUMBER => 'personal_number',
                PhoneNumberType::PAGER => 'pager',
                PhoneNumberType::UAN => 'uan',
                PhoneNumberType::VOICEMAIL => 'voicemail',
                default => 'unknown',
            };
        } catch (NumberParseException) {
            return null;
        }
    }
}

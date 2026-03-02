<?php

declare(strict_types=1);

namespace App\Services\Phone;

/**
 * Standardized error codes for phone validation.
 */
final class PhoneErrorCode
{
    public const INVALID_FORMAT = 'PHONE_INVALID_FORMAT';

    public const BLACKLISTED = 'PHONE_BLACKLISTED';

    public const NOT_MOBILE = 'PHONE_NOT_MOBILE';

    public const DOM_TOM_EXCLUDED = 'PHONE_DOM_TOM_EXCLUDED';

    public const TOO_SHORT = 'PHONE_TOO_SHORT';

    public const TOO_LONG = 'PHONE_TOO_LONG';

    public const PARSE_ERROR = 'PHONE_PARSE_ERROR';

    /**
     * Get human-readable message for an error code.
     */
    public static function getMessage(string $code): string
    {
        return match ($code) {
            self::INVALID_FORMAT => 'Le format du numéro de téléphone est invalide.',
            self::BLACKLISTED => 'Ce numéro de téléphone est blacklisté.',
            self::NOT_MOBILE => 'Seuls les numéros de mobile (06/07) sont acceptés.',
            self::DOM_TOM_EXCLUDED => 'Les numéros DOM-TOM ne sont pas acceptés pour cette campagne.',
            self::TOO_SHORT => 'Le numéro de téléphone est trop court.',
            self::TOO_LONG => 'Le numéro de téléphone est trop long.',
            self::PARSE_ERROR => 'Impossible de parser le numéro de téléphone.',
            default => 'Erreur de validation du numéro de téléphone.',
        };
    }
}

<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | DOM-TOM Phone Prefixes
    |--------------------------------------------------------------------------
    |
    | Phone number prefixes for French overseas territories (DOM-TOM).
    | Numbers starting with these prefixes are considered DOM-TOM.
    |
    */
    'domtom_prefixes' => ['0692', '0690', '0694', '0696'],

    /*
    |--------------------------------------------------------------------------
    | Blacklist Patterns
    |--------------------------------------------------------------------------
    |
    | Regular expression patterns for blacklisted phone numbers.
    | Any phone number matching one of these patterns will be rejected.
    |
    */
    'blacklist_patterns' => [],
];

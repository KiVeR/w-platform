<?php

declare(strict_types=1);

return [
    'default' => env('CAMPAIGN_SENDING_DRIVER', 'stub'),

    'drivers' => [
        'stub' => [],
        'wepak' => [
            'base_url' => env('WEPAK_API_URL', 'https://wepak.wellpack.fr'),
            'api_key' => env('WEPAK_API_KEY', ''),
            'timeout' => (int) env('WEPAK_TIMEOUT', 3600),
            'estimate_timeout' => (int) env('WEPAK_ESTIMATE_TIMEOUT', 30),
        ],
    ],

    'notifications' => [
        'failure_emails' => env('CAMPAIGN_FAILURE_EMAILS', ''),
        'stats_delay_hours' => 72,
    ],

    'sending' => [
        'window_start' => 8,  // 8h Europe/Paris
        'window_end' => 20,   // 20h Europe/Paris
        'timezone' => 'Europe/Paris',
    ],
];

<?php

declare(strict_types=1);

return [
    'default' => env('CAMPAIGN_SENDER_DRIVER', 'trigger'),

    'drivers' => [
        'trigger' => [
            // Config trigger-api (via SDK Http::triggerUrlApi())
        ],
        'wepak' => [
            'base_url' => env('WEPAK_BASE_URL', 'https://wepak.wellpack.fr'),
        ],
    ],
];

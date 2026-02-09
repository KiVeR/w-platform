<?php

declare(strict_types=1);

return [
    'default' => env('CAMPAIGN_STATS_DRIVER', 'stub'),

    'drivers' => [
        'stub' => [],
        'wepak' => [],  // réutilise config('campaign-sending.drivers.wepak')
        'trigger_api' => [
            'base_url' => env('TRIGGER_API_URL', 'http://localhost:8000'),
            'api_key' => env('TRIGGER_API_KEY', ''),
        ],
    ],
];

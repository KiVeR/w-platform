<?php

declare(strict_types=1);

return [
    'default' => env('CAMPAIGN_STATS_DRIVER', 'local'),

    'drivers' => [
        'stub' => [],
        'local' => [],
        'wepak' => [],  // réutilise config('campaign-sending.drivers.wepak')
    ],
];

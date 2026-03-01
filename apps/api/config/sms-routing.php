<?php

declare(strict_types=1);

return [
    'default' => env('SMS_ROUTING_DRIVER', 'stub'),

    'drivers' => [
        'stub' => [],

        'sinch' => [
            'region' => env('SINCH_REGION', 'eu'),
            'service_plan_id' => env('SINCH_SERVICE_PLAN_ID', ''),
            'api_token' => env('SINCH_API_TOKEN', ''),
            'callback_url' => env('SINCH_CALLBACK_URL', ''),
            'dry_run' => (bool) env('SINCH_DRY_RUN', false),
            'allow_dry_run' => (bool) env('SINCH_ALLOW_DRY_RUN', false),
        ],

        'infobip' => [
            'base_url' => env('INFOBIP_BASE_URL', ''),
            'api_token' => env('INFOBIP_API_TOKEN', ''),
            'notify_url' => env('INFOBIP_NOTIFY_URL', ''),
            'dry_run' => (bool) env('INFOBIP_DRY_RUN', false),
            'from_testing' => env('INFOBIP_FROM_TESTING', 'InfoSMS'),
        ],

        'highconnexion' => [
            'base_url' => env('HIGHCONNEXION_BASE_URL', ''),
            'account_id' => env('HIGHCONNEXION_ACCOUNT_ID', ''),
            'password' => env('HIGHCONNEXION_PASSWORD', ''),
            'callback_url' => env('HIGHCONNEXION_CALLBACK_URL', ''),
            'dry_run' => (bool) env('HIGHCONNEXION_DRY_RUN', false),
            'from_testing' => env('HIGHCONNEXION_FROM_TESTING', 'TestSMS'),
        ],
    ],
];

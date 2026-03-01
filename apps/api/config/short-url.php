<?php

declare(strict_types=1);

return [
    'redirect_external_url' => env('SHORT_URL_REDIRECT_EXTERNAL', 'https://c-lic.fr'),
    'redirect_internal_url' => env('SHORT_URL_REDIRECT_INTERNAL', 'https://cli-c.fr'),
    'excluded_domains' => explode(',', env('SHORT_URL_EXCLUDED_DOMAINS', '')),
];

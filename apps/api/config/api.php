<?php

declare(strict_types=1);

return [
    'pagination' => [
        'default' => 15,
        'large' => 50,
    ],
    'cache' => [
        'geo' => [
            'ttl' => 86400, // 24h
        ],
    ],
];

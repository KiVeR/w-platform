<?php

declare(strict_types=1);

use App\Http\Controllers\RedirectController;
use Illuminate\Support\Facades\Route;

$redirectDomains = array_values(array_unique(array_filter([
    parse_url((string) config('short-url.redirect_external_url'), PHP_URL_HOST),
    parse_url((string) config('short-url.redirect_internal_url'), PHP_URL_HOST),
])));

foreach ($redirectDomains as $domain) {
    Route::domain($domain)
        ->get('/{slug}', [RedirectController::class, 'redirect'])
        ->where('slug', '[^/]+');
}

if ($redirectDomains === [] || app()->environment(['local', 'testing'])) {
    Route::get('/{slug}', [RedirectController::class, 'redirect'])
        ->where('slug', '[^/]+');
}

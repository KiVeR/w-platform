<?php

declare(strict_types=1);

use App\Http\Controllers\RedirectController;
use Illuminate\Support\Facades\Route;

Route::get('/{slug}', [RedirectController::class, 'redirect'])
    ->where('slug', '[^/]+');

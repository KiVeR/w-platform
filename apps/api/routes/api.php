<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => (string) config('app.name'),
    'version' => '1.0.0',
]));

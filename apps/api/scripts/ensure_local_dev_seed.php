<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (! app()->environment('local')) {
    fwrite(STDOUT, "Skipping local seed bootstrap outside local environment.\n");

    return;
}

if (User::query()->exists()) {
    fwrite(STDOUT, "Local seed bootstrap skipped: users already exist.\n");

    return;
}

Artisan::call('db:seed', ['--force' => true]);

fwrite(STDOUT, Artisan::output());
fwrite(STDOUT, "Local seed bootstrap completed.\n");

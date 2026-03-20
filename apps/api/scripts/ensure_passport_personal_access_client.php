<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Laravel\Passport\ClientRepository;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$name = $argv[1] ?? 'Wellpack';
$provider = $argv[2] ?? config('auth.guards.api.provider');

$repository = app(ClientRepository::class);

try {
    $client = $repository->personalAccessClient($provider);
} catch (RuntimeException) {
    $client = $repository->createPersonalAccessGrantClient($name, $provider);
}

fwrite(STDOUT, sprintf(
    "Personal access client ready: %s (%s)\n",
    $client->name,
    $client->getKey(),
));

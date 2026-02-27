<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';

/*
 * PHPUnit <env force="true"> sets putenv() and $_ENV but NOT $_SERVER.
 * In Docker, environment variables are injected into $_SERVER at process start.
 * Laravel reads $_SERVER first (via ServerConstAdapter), so Docker values
 * override phpunit.xml settings unless we propagate $_ENV into $_SERVER.
 */
foreach ($_ENV as $key => $value) {
    $_SERVER[$key] = $value;
}

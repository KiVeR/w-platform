<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner as PassportEnsureClientIsResourceOwner;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that verifies the OAuth2 client is the resource owner (machine-to-machine).
 * Delegates to Passport's EnsureClientIsResourceOwner after adapting exceptions.
 */
class EnsureClientIsResourceOwner
{
    public function handle(Request $request, Closure $next, string ...$scopes): Response
    {
        $passportMiddleware = app(PassportEnsureClientIsResourceOwner::class);

        try {
            return $passportMiddleware->handle($request, $next, ...$scopes);
        } catch (\Laravel\Passport\Exceptions\AuthenticationException $e) {
            throw new AuthenticationException('Unauthenticated.');
        }
    }
}

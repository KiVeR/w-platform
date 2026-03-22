<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Marks a route as deprecated by injecting standard HTTP deprecation headers.
 *
 * Usage in routes: ->middleware('deprecate:2026-09-01')
 *
 * Headers added:
 *  - X-Deprecated: true   (non-standard, widely used by API consumers)
 *  - Deprecation: true    (RFC 8594 — https://datatracker.ietf.org/doc/html/rfc8594)
 *  - Sunset: <date>       (RFC 8594 sunset date, optional)
 *
 * The route remains fully functional — this middleware is informational only.
 */
class DeprecateEndpoint
{
    public function handle(Request $request, Closure $next, string $sunset = ''): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Deprecated', 'true');
        $response->headers->set('Deprecation', 'true');

        if ($sunset !== '') {
            $response->headers->set('Sunset', $sunset);
        }

        return $response;
    }
}

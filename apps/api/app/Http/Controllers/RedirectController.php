<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Jobs\IncrementClickCountJob;
use App\Models\ShortUrl;
use App\Services\ShortUrl\RedirectService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RedirectController extends Controller
{
    public function __construct(private readonly RedirectService $redirectService) {}

    public function redirect(string $slug, Request $request): RedirectResponse
    {
        [$defaultSlug, $suffix] = array_pad(explode('_', $slug, 2), 2, null);

        $shortUrl = ShortUrl::query()
            ->where('is_enabled', true)
            ->where('slug', $defaultSlug)
            ->firstOrFail();

        IncrementClickCountJob::dispatchAfterResponse(
            $shortUrl->id,
            $request->userAgent(),
            $request->headers->get('x-client-ip'),
            $request->headers->get('referer'),
            $suffix
        )->onQueue('analytics');

        return redirect()->away(
            $this->redirectService->buildDestinationUrl($shortUrl, $suffix)
        );
    }
}

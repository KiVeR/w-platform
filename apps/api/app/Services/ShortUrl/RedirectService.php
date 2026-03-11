<?php

declare(strict_types=1);

namespace App\Services\ShortUrl;

use App\Models\ShortUrl;
use App\Models\ShortUrlSuffix;
use Illuminate\Support\Facades\Log;

class RedirectService
{
    public function isExcludedDomains(?string $referer): bool
    {
        $refererDomain = $this->extractDomain($referer);
        $excludedDomains = config('short-url.excluded_domains', []);

        if (empty($excludedDomains) || ! $refererDomain) {
            return false;
        }

        return in_array($refererDomain, $excludedDomains, true);
    }

    public function processTrackingSuffix(ShortUrl $shortUrl, string $suffix, bool $isBot = false): void
    {
        $shortUrlSuffix = ShortUrlSuffix::where('slug', $suffix)
            ->where('short_url_id', $shortUrl->id)
            ->first();

        if (! $shortUrlSuffix) {
            return;
        }

        $shortUrlSuffix->incrementClickCount($isBot);

        Log::info('redirect.suffix_tracked', [
            'short_url_id' => $shortUrl->id,
            'suffix' => $suffix,
            'is_bot' => $isBot,
            'click_count' => $shortUrlSuffix->click_count,
            'click_count_bots' => $shortUrlSuffix->click_count_bots,
        ]);
    }

    public function buildDestinationUrl(ShortUrl $shortUrl, ?string $suffix): string
    {
        if (! empty($shortUrl->link)) {
            return $this->addHttpIfNeeded($shortUrl->link);
        }

        $link = config('short-url.redirect_internal_url').'/'.$shortUrl->slug;

        if ($suffix) {
            $link .= '/'.$suffix;
        }

        return $this->addHttpIfNeeded($link);
    }

    private function addHttpIfNeeded(string $url): string
    {
        $parsedUrl = parse_url($url);
        if (empty($parsedUrl['scheme'])) {
            $url = 'https://'.$url;
        }

        return $url;
    }

    private function extractDomain(?string $url = null): ?string
    {
        if (empty($url)) {
            return null;
        }

        $parsedUrl = parse_url($url);

        if ($parsedUrl && isset($parsedUrl['host'])) {
            return $parsedUrl['host'];
        }

        return null;
    }
}

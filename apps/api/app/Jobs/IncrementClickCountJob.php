<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\ShortUrl;
use App\Services\ShortUrl\RedirectService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Jenssegers\Agent\Agent;
use Throwable;

class IncrementClickCountJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 20;

    public function __construct(
        public int $shortUrlId,
        public ?string $userAgent,
        public ?string $ipAddress,
        public ?string $referer,
        public ?string $suffix = null,
    ) {
        $this->onQueue('analytics');
    }

    public function uniqueId(): string
    {
        return (string) $this->shortUrlId;
    }

    public function handle(RedirectService $redirectService): void
    {
        $shortUrl = ShortUrl::query()->find($this->shortUrlId);

        if ($this->shouldSkipProcessing($shortUrl, $redirectService)) {
            return;
        }

        [$isBot, $browser, $platform, $device] = $this->detectAgent();

        $isGoogle = false;

        if (! $isBot && $this->ipAddress) {
            try {
                $isGoogle = $this->isVerifiedGooglebot($this->ipAddress);

                if ($isGoogle) {
                    $isBot = true;
                }
            } catch (Throwable) {
                // Ignore host resolution errors
            }
        }

        $shortUrl->incrementClickCount($isBot);

        if (! empty($this->suffix) && $shortUrl->is_traceable_by_recipient) {
            try {
                $redirectService->processTrackingSuffix($shortUrl, $this->suffix, $isBot);
            } catch (Throwable $e) {
                Log::warning('redirect.suffix_failed', [
                    'short_url_id' => $shortUrl->id,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        // Logging
        $this->logHeaders(
            $shortUrl,
            $isBot,
            $isGoogle,
            $browser,
            $platform,
            $device,
        );
    }

    private function shouldSkipProcessing(?ShortUrl $shortUrl, RedirectService $redirectService): bool
    {
        return ! $shortUrl
            || ! $shortUrl->is_enabled
            || $shortUrl->is_draft
            || $redirectService->isExcludedDomains($this->referer);
    }

    private function detectAgent(): array
    {
        if (empty($this->userAgent)) {
            return [true, null, null, null];
        }

        $agent = new Agent;
        $agent->setUserAgent($this->userAgent);
        $agent->setHttpHeaders();

        return [
            $agent->isRobot(),
            $agent->browser() ?: null,
            $agent->platform() ?: null,
            $agent->device() ?: null,
        ];
    }

    private function isVerifiedGooglebot(string $ip): bool
    {
        // Reverse DNS lookup: IP -> Hostname
        $host = @gethostbyaddr($ip);
        if (! $host || $host === $ip) {
            return false;
        }

        $host = strtolower($host);

        // Ensure hostname is a Google-controlled domain
        if (! $this->isGoogleDomain($host)) {
            return false;
        }

        // Forward DNS lookup: Hostname -> IP(s)
        $resolvedIps = [];

        // IPv4 (A records)
        $aRecords = @dns_get_record($host, DNS_A);

        if (is_array($aRecords)) {
            foreach ($aRecords as $rec) {
                if (! empty($rec['ip'])) {
                    $resolvedIps[] = $rec['ip'];
                }
            }
        }

        // IPv6 (AAAA records)
        $aaaaRecords = @dns_get_record($host, DNS_AAAA);
        if (is_array($aaaaRecords)) {
            foreach ($aaaaRecords as $rec) {
                if (! empty($rec['ipv6'])) {
                    $resolvedIps[] = $rec['ipv6'];
                }
            }
        }

        // Fallback for IPv4 if needed
        if (empty($resolvedIps)) {
            $fallback = @gethostbynamel($host);
            if (is_array($fallback)) {
                $resolvedIps = array_merge($resolvedIps, $fallback);
            }
        }

        $resolvedIps = array_unique($resolvedIps);

        // Verify the original IP matches one of the forward-resolved IPs
        return in_array($ip, $resolvedIps, true);
    }

    private function isGoogleDomain(string $host): bool
    {
        // Accept exactly the domain or any subdomain under these suffixes
        return $host === 'googlebot.com'
            || $host === 'google.com'
            || str_ends_with($host, '.googlebot.com')
            || str_ends_with($host, '.google.com');
    }

    private function logHeaders(
        ShortUrl $shortUrl,
        bool $isBot,
        bool $isGoogle,
        ?string $browser,
        ?string $platform,
        ?string $device
    ): void {
        try {
            $payload = [
                'event' => 'short_url_redirect',
                'short_url_id' => $shortUrl->id,
                'ip_address' => $this->ipAddress,
                'user_agent' => $this->userAgent,
                'is_bot' => $isBot,
                'is_google' => $isGoogle,
                'slug' => $shortUrl->slug,
                'browser' => $browser,
                'platform' => $platform,
                'device' => $device,
                'traceable_by_recipient' => (bool) $shortUrl->is_traceable_by_recipient,
                'suffix' => $this->suffix,
                'referer' => $this->referer,
                'timestamp' => now()->toIso8601String(),
            ];

            Log::channel('redirect-headers')->info('redirect-headers', $payload);
        } catch (Throwable $e) {
            Log::warning('redirect.analytics_failed', [
                'message' => $e->getMessage(),
                'short_url_id' => $shortUrl->id,
            ]);
        }
    }
}

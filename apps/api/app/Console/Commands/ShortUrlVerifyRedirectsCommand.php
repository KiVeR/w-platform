<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ShortUrl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class ShortUrlVerifyRedirectsCommand extends Command
{
    /** @var string */
    protected $signature = 'short-url:verify-redirects
        {--old-url= : Base URL of the legacy short-url-api (e.g. https://short.wellpack.fr)}
        {--new-url= : Base URL of the platform-api (e.g. https://api.wellpack.fr)}
        {--limit=100 : Number of random short URLs to verify}';

    /** @var string */
    protected $description = 'Compare redirect responses between the old short-url-api and the new platform-api';

    public function handle(): int
    {
        /** @var string|null $oldUrl */
        $oldUrl = $this->option('old-url');

        /** @var string|null $newUrl */
        $newUrl = $this->option('new-url');

        if (! $oldUrl || ! $newUrl) {
            $this->error('Both --old-url and --new-url options are required.');

            return self::FAILURE;
        }

        $oldUrl = rtrim($oldUrl, '/');
        $newUrl = rtrim($newUrl, '/');

        /** @var int $limit */
        $limit = (int) $this->option('limit');

        $shortUrls = ShortUrl::where('is_enabled', true)
            ->inRandomOrder()
            ->limit($limit)
            ->get();

        if ($shortUrls->isEmpty()) {
            $this->warn('No enabled short URLs found in the database.');

            return self::SUCCESS;
        }

        $this->info("Verifying {$shortUrls->count()} short URLs between:");
        $this->line("  Old: {$oldUrl}");
        $this->line("  New: {$newUrl}");
        $this->newLine();

        $matches = 0;
        $mismatches = 0;
        $errors = 0;

        $this->withProgressBar($shortUrls, function (ShortUrl $shortUrl) use ($oldUrl, $newUrl, &$matches, &$mismatches, &$errors): void {
            try {
                $oldResponse = Http::withoutRedirecting()
                    ->timeout(10)
                    ->get("{$oldUrl}/{$shortUrl->slug}");

                $newResponse = Http::withoutRedirecting()
                    ->timeout(10)
                    ->get("{$newUrl}/{$shortUrl->slug}");

                $oldStatus = $oldResponse->status();
                $newStatus = $newResponse->status();
                $oldLocation = $oldResponse->header('Location');
                $newLocation = $newResponse->header('Location');

                if ($oldStatus === $newStatus && $oldLocation === $newLocation) {
                    $matches++;
                } else {
                    $mismatches++;
                    $this->newLine();
                    $this->warn("  MISMATCH: /{$shortUrl->slug}");
                    $this->line("    Old: HTTP {$oldStatus} → {$oldLocation}");
                    $this->line("    New: HTTP {$newStatus} → {$newLocation}");
                }
            } catch (\Throwable $e) {
                $errors++;
                $this->newLine();
                $this->error("  ERROR: /{$shortUrl->slug} — {$e->getMessage()}");
            }
        });

        $this->newLine(2);

        $total = $matches + $mismatches + $errors;

        $this->info('=== Verification Report ===');
        $this->line("  Total checked: {$total}");
        $this->line("  Matches:       {$matches}");
        $this->line("  Mismatches:    {$mismatches}");
        $this->line("  Errors:        {$errors}");

        if ($total > 0) {
            $matchRate = round(($matches / $total) * 100, 1);
            $this->line("  Match rate:    {$matchRate}%");
        }

        $this->newLine();

        if ($mismatches === 0 && $errors === 0) {
            $this->info('All redirects match. Safe to proceed with DNS cutover.');

            return self::SUCCESS;
        }

        $this->error('Redirect mismatches or errors detected. Do NOT proceed with DNS cutover.');

        return self::FAILURE;
    }
}

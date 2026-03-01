<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\ShortUrlSuffixRequest;
use App\Services\ShortUrl\ShortUrlSuffixService;
use Exception;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class GenerateRandomUniqueSuffixJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $shortUrlId,
        public readonly int $shortUrlSuffixRequestId,
    ) {}

    public int $uniqueFor = 600;

    public function uniqueId(): string
    {
        return (string) $this->shortUrlId;
    }

    /**
     * @throws \Throwable
     */
    public function handle(ShortUrlSuffixService $shortUrlSuffixService): void
    {
        $shortUrlSuffixRequest = ShortUrlSuffixRequest::query()
            ->whereHas('shortUrl', function (Builder $query): void {
                $query
                    ->where('id', $this->shortUrlId)
                    ->where('is_enabled', true);
            })
            ->where('id', $this->shortUrlSuffixRequestId)
            ->with('shortUrl')
            ->firstOrFail();

        DB::beginTransaction();

        try {
            $shortUrlSuffixService->generateRandomUniqueSuffixes(
                $shortUrlSuffixRequest->shortUrl,
                $shortUrlSuffixRequest->quantity,
                $shortUrlSuffixRequest->batch_uuid,
            );

            DB::commit();
        } catch (Exception $exception) {
            DB::rollback();

            throw $exception;
        } finally {
            $shortUrlSuffixRequest->delete();
        }
    }
}

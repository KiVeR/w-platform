<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\SmsRouting\PullReportsJob;
use Illuminate\Console\Command;

class PullReportsCommand extends Command
{
    protected $signature = 'app:pull-reports';

    protected $description = 'Dispatch pull reports job as resilience fallback for missed webhooks';

    public function handle(): void
    {
        PullReportsJob::dispatch();
        $this->info('Dispatched pull reports job.');
    }
}

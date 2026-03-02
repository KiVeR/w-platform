<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\SmsRouting\DigestDeliveryReportsJob;
use App\Models\DeliveryReport;
use Illuminate\Console\Command;

class DigestDeliveryReportsCommand extends Command
{
    protected $signature = 'app:digest-delivery-reports';

    protected $description = 'Dispatch digest jobs for unprocessed delivery reports';

    /** @var list<string> */
    private const PROVIDERS = ['sinch', 'infobip', 'highconnexion'];

    public function handle(): void
    {
        foreach (self::PROVIDERS as $provider) {
            if (DeliveryReport::forProvider($provider)->undigested()->exists()) {
                DigestDeliveryReportsJob::dispatch($provider);
                $this->info("Dispatched digest job for {$provider}.");
            }
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Campaign;
use App\Services\Targeting\TargetingResolver;
use Illuminate\Console\Command;

class RefreshTargetingCommand extends Command
{
    /** @var string */
    protected $signature = 'targeting:refresh
        {--status=draft,scheduled : Statuses to refresh (CSV)}
        {--dry-run : Display without modifying}';

    /** @var string */
    protected $description = 'Re-resolve targeting zones from input for active campaigns (after geo:seed)';

    public function handle(TargetingResolver $resolver): int
    {
        /** @var string $statusOption */
        $statusOption = $this->option('status');
        $statuses = explode(',', $statusOption);
        $dryRun = (bool) $this->option('dry-run');

        $campaigns = Campaign::whereIn('status', $statuses)
            ->whereNotNull('targeting')
            ->cursor();

        $refreshed = 0;

        foreach ($campaigns as $campaign) {
            if (! is_array($campaign->targeting)) {
                continue;
            }

            $canonical = $resolver->refreshFromInput($campaign->targeting);

            if ($canonical === null) {
                continue;
            }

            if (! $dryRun) {
                $campaign->update([
                    'targeting' => $canonical->toArray(),
                    'volume_estimated' => 0,
                ]);
            }

            $refreshed++;
            $this->line("  → Campaign #{$campaign->id}: {$canonical->method} ({$refreshed})");
        }

        $this->info(($dryRun ? '[DRY-RUN] ' : '')."Refreshed {$refreshed} campaigns.");

        return self::SUCCESS;
    }
}

<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\CampaignDispatched;
use App\Services\TargetingTemplateService;

class AutoSaveTargetingTemplate
{
    public function __construct(
        private readonly TargetingTemplateService $templateService,
    ) {}

    public function handle(CampaignDispatched $event): void
    {
        if ($event->method === 'send') {
            $this->templateService->autoSaveFromCampaign($event->campaign);
        }
    }
}

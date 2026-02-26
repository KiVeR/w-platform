<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:send-scheduled-campaigns')->everyMinute();
Schedule::command('app:notify-campaign-stats')->dailyAt('11:00');
Schedule::command('app:notify-abandoned-drafts')->dailyAt('09:00');

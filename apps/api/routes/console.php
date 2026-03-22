<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

Schedule::command('horizon:snapshot')->everyFiveMinutes();
Schedule::command('app:send-scheduled-campaigns')->everyMinute();
Schedule::command('app:notify-campaign-stats')->dailyAt('11:00');
Schedule::command('app:notify-abandoned-drafts')->dailyAt('09:00');

// Operations lifecycle
Schedule::command('operations:auto-transition')->everyMinute()->onOneServer();
Schedule::command('operations:auto-bill')->everyFiveMinutes()->onOneServer();

// SMS routing scheduler
Schedule::command('app:request-campaign-query')->everyMinute()->onOneServer();
Schedule::command('app:request-campaign-routing')->everyMinute()->onOneServer();
Schedule::command('app:digest-delivery-reports')->everyMinute()->onOneServer();
Schedule::command('app:pull-reports')->everyFiveMinutes()->onOneServer();

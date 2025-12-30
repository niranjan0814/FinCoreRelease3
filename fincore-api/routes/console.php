<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Schedule the auto-logout command to run at midnight
 * This will close all open staff sessions and lock user accounts
 */
Schedule::command('sessions:auto-logout')->dailyAt('00:00');

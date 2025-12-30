<?php

namespace App\Console\Commands;

use App\Services\StaffSessionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AutoLogoutStaffSessions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'sessions:auto-logout';

    /**
     * The console command description.
     */
    protected $description = 'Automatically logout all open staff sessions at midnight and lock user accounts';

    protected StaffSessionService $sessionService;

    public function __construct(StaffSessionService $sessionService)
    {
        parent::__construct();
        $this->sessionService = $sessionService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting auto-logout process...');
        
        try {
            $count = $this->sessionService->autoLogoutAllOpenSessions();
            
            $this->info("Successfully auto-logged out {$count} sessions.");
            Log::info("Auto-logout command completed. Logged out {$count} sessions.");
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Auto-logout failed: {$e->getMessage()}");
            Log::error("Auto-logout command failed: {$e->getMessage()}");
            
            return Command::FAILURE;
        }
    }
}

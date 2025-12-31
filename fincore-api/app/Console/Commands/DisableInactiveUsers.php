<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DisableInactiveUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:disable-inactive';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Disable users who have not logged in for 1 week';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $limitDate = now()->subDays(7);
        
        $this->info("Checking for inactive users before: " . $limitDate->toDateTimeString());

        // Find active users who haven't logged in since the limit date
        // OR created more than 7 days ago and never logged in
        $inactiveUsers = User::where('is_active', true)
            ->where(function($query) use ($limitDate) {
                $query->where('last_login_at', '<', $limitDate)
                      ->orWhere(function($subQuery) use ($limitDate) {
                          $subQuery->whereNull('last_login_at')
                                   ->where('created_at', '<', $limitDate);
                      });
            })
            ->get();

        $count = 0;

        foreach ($inactiveUsers as $user) {
            // Skip Super Admins to prevent system lockout
            if ($user->hasRole('super_admin')) {
                $this->info("Skipping Super Admin: {$user->user_name}");
                continue;
            }

            $user->update(['is_active' => false]);
            
            // Revoke tokens to force logout if they are somehow active
            $user->tokens()->delete();

            Log::info("User account auto-disabled due to inactivity: {$user->id} - {$user->user_name}");
            $this->info("Disabled user: {$user->user_name}");
            
            $count++;
        }

        $this->info("Completed. Disabled {$count} inactive user(s).");
    }
}

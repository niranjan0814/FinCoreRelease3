<?php

namespace App\Services;

use App\Models\StaffSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StaffSessionService
{
    /**
     * Start a new session when user logs in
     */
    public function startSession(User $user, ?string $ip = null, ?string $userAgent = null): StaffSession
    {
        $today = now()->toDateString();
        
        // Check if user has an open session already
        $existingOpenSession = StaffSession::openForUser($user->id)->first();
        
        if ($existingOpenSession) {
            // User already has an open session - return it
            Log::info("User {$user->id} already has an open session #{$existingOpenSession->id}");
            return $existingOpenSession;
        }
        
        // Create new session
        $session = StaffSession::create([
            'user_id' => $user->id,
            'date' => $today,
            'login_at' => now(),
            'status' => StaffSession::STATUS_OPEN,
            'attendance_status' => StaffSession::ATTENDANCE_PRESENT,
            'login_ip' => $ip,
            'user_agent' => $userAgent,
        ]);
        
        Log::info("Started session #{$session->id} for user {$user->id}");
        
        return $session;
    }

    /**
     * End a session with specified logout type
     */
    public function endSession(User $user, string $logoutType, ?string $remarks = null): ?StaffSession
    {
        $session = StaffSession::openForUser($user->id)->first();
        
        if (!$session) {
            Log::warning("No open session found for user {$user->id}");
            return null;
        }
        
        $now = now();
        $workedMinutes = $session->login_at->diffInMinutes($now);
        
        // Determine if this is a closing logout type
        $isClosed = StaffSession::isClosingLogoutType($logoutType);
        $isAutoLogout = $logoutType === StaffSession::LOGOUT_TYPE_AUTO_LOGOUT;
        
        $session->update([
            'logout_at' => $now,
            'logout_type' => $logoutType,
            'auto_logged_out' => $isAutoLogout,
            'status' => $isClosed ? StaffSession::STATUS_CLOSED : StaffSession::STATUS_OPEN,
            'worked_minutes' => $workedMinutes,
            'remarks' => $remarks,
        ]);
        
        // Lock account until end of day if LOGOUT type
        // SKIP for admin and super_admin - they can login/logout anytime
        if ($logoutType === StaffSession::LOGOUT_TYPE_LOGOUT) {
            $isAdminOrSuperAdmin = $user->hasRole('super_admin') || $user->hasRole('admin');
            
            if (!$isAdminOrSuperAdmin) {
                $endOfDay = now()->endOfDay(); // 23:59:59
                $user->update(['locked_until' => $endOfDay]);
                Log::info("User {$user->id} locked until {$endOfDay}");
            } else {
                Log::info("User {$user->id} is admin/super_admin - skipping account lock");
            }
        }
        
        Log::info("Ended session #{$session->id} for user {$user->id} with type {$logoutType}");
        
        return $session->fresh();
    }

    /**
     * Perform auto-logout for all open sessions at midnight
     */
    public function autoLogoutAllOpenSessions(): int
    {
        $openSessions = StaffSession::where('status', StaffSession::STATUS_OPEN)->get();
        $count = 0;
        
        foreach ($openSessions as $session) {
            $now = now();
            $workedMinutes = $session->login_at->diffInMinutes($now);
            
            $session->update([
                'logout_at' => $now,
                'logout_type' => StaffSession::LOGOUT_TYPE_AUTO_LOGOUT,
                'auto_logged_out' => true,
                'status' => StaffSession::STATUS_CLOSED,
                'worked_minutes' => $workedMinutes,
                'remarks' => 'System auto-logout at midnight',
            ]);
            
            // Lock user account - SKIP for admin and super_admin
            if ($session->user) {
                $isAdminOrSuperAdmin = $session->user->hasRole('super_admin') || $session->user->hasRole('admin');
                
                if (!$isAdminOrSuperAdmin) {
                    $session->user->update(['locked_until' => now()->endOfDay()]);
                } else {
                    Log::info("User {$session->user->id} is admin/super_admin - skipping account lock on auto-logout");
                }
            }
            
            $count++;
        }
        
        Log::info("Auto-logged out {$count} sessions at midnight");
        
        return $count;
    }

    /**
     * Get user's open session
     */
    public function getOpenSession(User $user): ?StaffSession
    {
        return StaffSession::openForUser($user->id)->first();
    }

    /**
     * Get user's sessions for a specific date
     */
    public function getSessionsForDate(User $user, $date): \Illuminate\Database\Eloquent\Collection
    {
        return StaffSession::where('user_id', $user->id)
                          ->where('date', $date)
                          ->orderBy('login_at')
                          ->get();
    }

    /**
     * Get total worked minutes for a user on a specific date
     */
    public function getTotalWorkedMinutes(User $user, $date): int
    {
        return StaffSession::getTotalWorkedMinutesForDate($user->id, $date);
    }

    /**
     * Mark attendance as pending (for early/accidental logout)
     */
    public function markAttendancePending(StaffSession $session, ?string $remarks = null): StaffSession
    {
        $session->update([
            'attendance_status' => StaffSession::ATTENDANCE_PENDING,
            'remarks' => $remarks ?? $session->remarks,
        ]);
        
        return $session->fresh();
    }

    /**
     * Approve attendance
     */
    public function approveAttendance(StaffSession $session, User $approver, ?string $remarks = null): StaffSession
    {
        $session->update([
            'attendance_status' => StaffSession::ATTENDANCE_APPROVED,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'remarks' => $remarks ?? $session->remarks,
        ]);
        
        Log::info("Session #{$session->id} attendance approved by user {$approver->id}");
        
        return $session->fresh();
    }

    /**
     * Reject attendance
     */
    public function rejectAttendance(StaffSession $session, User $approver, ?string $remarks = null): StaffSession
    {
        $session->update([
            'attendance_status' => StaffSession::ATTENDANCE_REJECTED,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'remarks' => $remarks ?? $session->remarks,
        ]);
        
        Log::info("Session #{$session->id} attendance rejected by user {$approver->id}");
        
        return $session->fresh();
    }

    public function unlockUserAccount(User $user): void
    {
        $user->update([
            'locked_until' => null,
            'is_active' => true,
        ]);
        
        Log::info("User {$user->id} account manually unlocked");
    }

    /**
     * Emergency lock user account and close session
     */
    public function emergencyLockUser(User $user): void
    {
        // 1. Lock the account
        $user->lockAccount();

        // 2. Find and close any open session for today
        $openSession = StaffSession::where('user_id', $user->id)
            ->where('status', StaffSession::STATUS_OPEN)
            ->first();

        if ($openSession) {
            $openSession->update([
                'status' => StaffSession::STATUS_CLOSED,
                'logout_at' => now(),
                'logout_type' => StaffSession::LOGOUT_TYPE_AUTO_LOGOUT,
                'remarks' => 'Session terminated and account locked by manager.',
                'auto_logged_out' => true,
            ]);
            Log::info("Closed open session #{$openSession->id} during emergency lock for user {$user->id}");
        }

        Log::info("User {$user->id} account manually locked by manager");
    }

    /**
     * Reopen an accidentally closed session (LOGOUT type)
     */
    public function reopenAccidentalLogout(User $user): ?StaffSession
    {
        $today = now()->toDateString();
        
        // Find the last closed session for today with LOGOUT type
        $session = StaffSession::where('user_id', $user->id)
                                ->where('date', $today)
                                ->where('status', StaffSession::STATUS_CLOSED)
                                ->where('logout_type', StaffSession::LOGOUT_TYPE_LOGOUT)
                                ->latest('logout_at')
                                ->first();
        
        // Always unlock the account regardless if a session record is found
        $this->unlockUserAccount($user);
        
        if (!$session) {
            Log::warning("No accidental logout session found for user {$user->id} today");
            return null;
        }
        
        // Reopen the session
        $session->update([
            'status' => StaffSession::STATUS_OPEN,
            'logout_at' => null,
            'logout_type' => null,
            'auto_logged_out' => false,
        ]);
        
        Log::info("Reopened accidental logout session #{$session->id} for user {$user->id}");
        
        return $session->fresh();
    }

    /**
     * Get attendance summary for a date range
     */
    public function getAttendanceSummary(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $sessions = StaffSession::where('user_id', $user->id)
                               ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
                               ->orderBy('date')
                               ->get();
        
        $summary = [];
        $currentDate = $startDate->copy();
        
        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->toDateString();
            $daySessions = $sessions->where('date', $dateStr);
            
            $totalMinutes = $daySessions->where('status', StaffSession::STATUS_CLOSED)->sum('worked_minutes');
            
            $summary[$dateStr] = [
                'date' => $dateStr,
                'sessions_count' => $daySessions->count(),
                'total_worked_minutes' => $totalMinutes,
                'total_worked_hours' => round($totalMinutes / 60, 2),
                'is_present' => $daySessions->isNotEmpty(),
                'attendance_status' => $daySessions->first()?->attendance_status ?? 'ABSENT',
            ];
            
            $currentDate->addDay();
        }
        
        return $summary;
    }

    /**
     * Check if user should see midnight warning popup
     * Admin and super_admin users don't need warnings - they can login/logout anytime
     */
    public function shouldShowMidnightWarning(User $user): bool
    {
        // Admin and super_admin don't need midnight warnings
        if ($user->hasRole('super_admin') || $user->hasRole('admin')) {
            return false;
        }
        
        $now = now();
        $warningTime = $now->copy()->setTime(23, 55, 0);
        $midnight = $now->copy()->addDay()->startOfDay();
        
        // Show warning between 23:55 and midnight
        if ($now >= $warningTime && $now < $midnight) {
            return StaffSession::openForUser($user->id)->exists();
        }
        
        return false;
    }

    /**
     * Get open sessions that need auto-logout
     */
    public function getSessionsForAutoLogout(): \Illuminate\Database\Eloquent\Collection
    {
        return StaffSession::where('status', StaffSession::STATUS_OPEN)->get();
    }

    /**
     * Resume session (for ON_WORK or STAY_IN_OFFICE returns)
     */
    public function resumeSession(User $user, ?string $ip = null, ?string $userAgent = null): StaffSession
    {
        $today = now()->toDateString();
        
        // Check for existing open session with temporary logout
        $existingSession = StaffSession::where('user_id', $user->id)
                                       ->where('date', $today)
                                       ->where('status', StaffSession::STATUS_OPEN)
                                       ->whereIn('logout_type', [
                                           StaffSession::LOGOUT_TYPE_ON_WORK,
                                           StaffSession::LOGOUT_TYPE_STAY_IN_OFFICE
                                       ])
                                       ->first();
        
        if ($existingSession) {
            // Clear temporary logout state
            $existingSession->update([
                'logout_at' => null,
                'logout_type' => null,
            ]);
            
            Log::info("Resumed session #{$existingSession->id} for user {$user->id}");
            return $existingSession->fresh();
        }
        
        // No resumable session, start a new one
        return $this->startSession($user, $ip, $userAgent);
    }
}

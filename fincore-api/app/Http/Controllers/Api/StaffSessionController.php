<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseController;
use App\Models\StaffSession;
use App\Models\User;
use App\Services\StaffSessionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StaffSessionController extends BaseController
{
    protected StaffSessionService $sessionService;

    public function __construct(StaffSessionService $sessionService)
    {
        $this->sessionService = $sessionService;
        $this->middleware('auth:sanctum');
    }

    /**
     * Get current user's open session
     */
    public function getCurrentSession(Request $request)
    {
        $user = $request->user();
        $session = $this->sessionService->getOpenSession($user);

        if (!$session) {
            return $this->success(null, 'No active session found');
        }

        return $this->success([
            'session' => $this->formatSession($session),
            'should_show_midnight_warning' => $this->sessionService->shouldShowMidnightWarning($user),
        ], 'Current session retrieved successfully');
    }

    /**
     * End current session with a specific logout type
     */
    public function endSession(Request $request)
    {
        $request->validate([
            'logout_type' => 'required|in:LOGOUT,ON_WORK,STAY_IN_OFFICE',
            'remarks' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $session = $this->sessionService->endSession(
            $user,
            $request->logout_type,
            $request->remarks
        );

        if (!$session) {
            return $this->notFound('No active session found');
        }

        $message = match ($request->logout_type) {
            'LOGOUT' => 'Session ended. You have been logged out for the day.',
            'ON_WORK' => 'Temporary logout recorded. Session remains active.',
            'STAY_IN_OFFICE' => 'Idle status recorded. Session remains active.',
            default => 'Session status updated.',
        };

        return $this->success([
            'session' => $this->formatSession($session),
            'is_locked' => $user->fresh()->is_locked,
        ], $message);
    }

    /**
     * Resume session after ON_WORK or STAY_IN_OFFICE
     */
    public function resumeSession(Request $request)
    {
        $user = $request->user();
        
        $session = $this->sessionService->resumeSession(
            $user,
            $request->ip(),
            $request->userAgent()
        );

        return $this->success([
            'session' => $this->formatSession($session),
        ], 'Session resumed successfully');
    }

    /**
     * Get user's sessions for today
     */
    public function getTodaySessions(Request $request)
    {
        $user = $request->user();
        $sessions = $this->sessionService->getSessionsForDate($user, today());
        $totalMinutes = $this->sessionService->getTotalWorkedMinutes($user, today());

        return $this->success([
            'sessions' => $sessions->map(fn ($s) => $this->formatSession($s)),
            'total_worked_minutes' => $totalMinutes,
            'total_worked_hours' => round($totalMinutes / 60, 2),
            'should_show_midnight_warning' => $this->sessionService->shouldShowMidnightWarning($user),
        ], 'Today\'s sessions retrieved successfully');
    }

    /**
     * Get user's sessions for a specific date
     */
    public function getSessionsByDate(Request $request)
    {
        $request->validate([
            'date' => 'required|date|date_format:Y-m-d',
        ]);

        $user = $request->user();
        $date = Carbon::parse($request->date);
        $sessions = $this->sessionService->getSessionsForDate($user, $date);
        $totalMinutes = $this->sessionService->getTotalWorkedMinutes($user, $date);

        return $this->success([
            'date' => $request->date,
            'sessions' => $sessions->map(fn ($s) => $this->formatSession($s)),
            'total_worked_minutes' => $totalMinutes,
            'total_worked_hours' => round($totalMinutes / 60, 2),
        ], 'Sessions retrieved successfully');
    }

    /**
     * Get attendance summary for date range
     */
    public function getAttendanceSummary(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date|date_format:Y-m-d',
            'end_date' => 'required|date|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        $user = $request->user();
        $summary = $this->sessionService->getAttendanceSummary(
            $user,
            Carbon::parse($request->start_date),
            Carbon::parse($request->end_date)
        );

        return $this->success([
            'summary' => $summary,
        ], 'Attendance summary retrieved successfully');
    }

    /**
     * Check midnight warning status
     */
    public function checkMidnightWarning(Request $request)
    {
        $user = $request->user();
        $showWarning = $this->sessionService->shouldShowMidnightWarning($user);

        return $this->success([
            'should_show_warning' => $showWarning,
            'current_time' => now()->toIso8601String(),
            'warning_message' => $showWarning 
                ? 'It is almost midnight. Please log out to save your work hours. System will auto-logout at 12:00 AM.' 
                : null,
        ], 'Midnight warning status checked');
    }

    /**
     * Handle midnight timeout - discard session and lock account
     * Called when user doesn't respond to the warning within the countdown period
     */
    public function midnightTimeout(Request $request)
    {
        $user = $request->user();
        
        // Get open session
        $session = $this->sessionService->getOpenSession($user);
        
        if ($session) {
            // Mark session as auto-logged out with remarks indicating timeout
            $session->update([
                'logout_at' => now(),
                'logout_type' => StaffSession::LOGOUT_TYPE_AUTO_LOGOUT,
                'auto_logged_out' => true,
                'status' => StaffSession::STATUS_CLOSED,
                'worked_minutes' => $session->login_at->diffInMinutes(now()),
                'remarks' => 'Session discarded due to midnight warning timeout. User did not respond within 60 seconds.',
                'attendance_status' => StaffSession::ATTENDANCE_PENDING, // Mark as pending for manager review
            ]);
        }
        
        // Lock user account - requires manager to unlock
        $user->update([
            'locked_until' => null, // No time limit - manager must unlock
            'is_active' => false,   // Deactivate the account
        ]);
        
        // Revoke all tokens
        $user->tokens()->delete();
        
        return $this->success([
            'session_discarded' => true,
            'account_locked' => true,
        ], 'Session discarded and account locked due to midnight timeout. Contact your manager to unlock.');
    }

    // ==================== MANAGER/ADMIN ENDPOINTS ====================

    /**
     * Get all pending attendance requests (for managers)
     */
    public function getPendingAttendance(Request $request)
    {
        // Check if user has permission to approve attendance
        if (!$request->user()->hasPermissionTo('attendance.approve')) {
            return $this->forbidden('Permission denied');
        }

        $pendingSessions = StaffSession::with(['user', 'user.staffDetail'])
            ->where('attendance_status', StaffSession::ATTENDANCE_PENDING)
            ->orderBy('date', 'desc')
            ->get();

        return $this->success([
            'pending_sessions' => $pendingSessions->map(fn ($s) => $this->formatSessionWithUser($s)),
        ], 'Pending attendance requests retrieved successfully');
    }

    /**
     * Approve attendance (for managers)
     */
    public function approveAttendance(Request $request, $sessionId)
    {
        if (!$request->user()->hasPermissionTo('attendance.approve')) {
            return $this->forbidden('Permission denied');
        }

        $request->validate([
            'remarks' => 'nullable|string|max:500',
        ]);

        $session = StaffSession::find($sessionId);
        if (!$session) {
            return $this->notFound('Session not found');
        }

        $session = $this->sessionService->approveAttendance(
            $session,
            $request->user(),
            $request->remarks
        );

        return $this->success([
            'session' => $this->formatSessionWithUser($session),
        ], 'Attendance approved successfully');
    }

    /**
     * Reject attendance (for managers)
     */
    public function rejectAttendance(Request $request, $sessionId)
    {
        if (!$request->user()->hasPermissionTo('attendance.approve')) {
            return $this->forbidden('Permission denied');
        }

        $request->validate([
            'remarks' => 'required|string|max:500',
        ]);

        $session = StaffSession::find($sessionId);
        if (!$session) {
            return $this->notFound('Session not found');
        }

        $session = $this->sessionService->rejectAttendance(
            $session,
            $request->user(),
            $request->remarks
        );

        return $this->success([
            'session' => $this->formatSessionWithUser($session),
        ], 'Attendance rejected');
    }

    /**
     * Unlock a user's account and reopen accidental logout session (for managers)
     */
    public function unlockUserAccount(Request $request, $userId)
    {
        if (!$request->user()->hasPermissionTo('users.unlock')) {
            return $this->forbidden('Permission denied');
        }

        $user = User::find($userId);
        if (!$user) {
            return $this->notFound('User not found');
        }

        $session = $this->sessionService->reopenAccidentalLogout($user);

        return $this->success([
            'user_id' => $user->id,
            'is_locked' => $user->fresh()->is_locked,
            'reopened_session' => $session ? $this->formatSession($session) : null,
        ], 'User account unlocked and session reopened successfully');
    }

    /**
     * Lock a user's account and end active session (for managers)
     */
    public function lockUserAccount(Request $request, $userId)
    {
        if (!$request->user()->hasPermissionTo('users.unlock')) {
            return $this->forbidden('Permission denied');
        }

        $user = User::find($userId);
        if (!$user) {
            return $this->notFound('User not found');
        }

        if ($user->id === $request->user()->id) {
            return $this->error('You cannot lock your own account', 400);
        }

        // Use service to close session if open and lock user
        $this->sessionService->emergencyLockUser($user);

        return $this->success([
            'user_id' => $user->id,
            'is_locked' => $user->fresh()->is_locked,
        ], 'User account locked and session closed successfully');
    }

    /**
     * Get all sessions for a specific user (for managers)
     */
    public function getUserSessions(Request $request, $userId)
    {
        if (!$request->user()->hasPermissionTo('sessions.view_all')) {
            return $this->forbidden('Permission denied');
        }

        $request->validate([
            'start_date' => 'nullable|date|date_format:Y-m-d',
            'end_date' => 'nullable|date|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        $user = User::find($userId);
        if (!$user) {
            return $this->notFound('User not found');
        }

        $query = StaffSession::where('user_id', $userId);

        if ($request->start_date) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->where('date', '<=', $request->end_date);
        }

        $sessions = $query->orderBy('date', 'desc')->orderBy('login_at', 'desc')->get();

        return $this->success([
            'user' => [
                'id' => $user->id,
                'user_name' => $user->user_name,
            ],
            'sessions' => $sessions->map(fn ($s) => $this->formatSession($s)),
        ], 'User sessions retrieved successfully');
    }

    /**
     * Get attendance report for all staff (for managers)
     */
    public function getAttendanceReport(Request $request)
    {
        if (!$request->user()->hasPermissionTo('attendance.view_reports') && 
            !$request->user()->hasPermissionTo('attendance.approve') &&
            !$request->user()->hasPermissionTo('sessions.view')) {
            return $this->forbidden('Permission denied');
        }

        $request->validate([
            'date' => 'required|date|date_format:Y-m-d',
        ]);

        $date = $request->date;
        $currentUser = $request->user();

        // Get all active users who can have attendance, respecting hierarchy
        $userQuery = User::where('is_active', true)
            ->with(['staffDetail']);

        // Apply hierarchy visibility (consistent with UserController)
        if (!$currentUser->isSuperAdmin()) {
            $userQuery->whereHas('roles', function ($q) use ($currentUser) {
                $q->where('hierarchy', '>=', $currentUser->getRoleHierarchy());
            });
        }

        $users = $userQuery->get();



        // Get all sessions for the date
        $sessions = StaffSession::where('date', $date)->get()->groupBy('user_id');

        $report = $users->map(function ($user) use ($sessions) {
            $userSessions = $sessions->get($user->id, collect());
            
            // Calculate total minutes including active session
            $totalMinutes = 0;
            $isOnline = false;
            foreach ($userSessions as $s) {
                if ($s->status === StaffSession::STATUS_CLOSED) {
                    $totalMinutes += $s->worked_minutes;
                } else {
                    $totalMinutes += $s->login_at->diffInMinutes(now());
                    $isOnline = true;
                }
            }

            $firstSession = $userSessions->sortBy('login_at')->first();
            $lastSession = $userSessions->sortByDesc('login_at')->first();
            
            // Determine a robust attendance status
            $status = 'PENDING';
            if ($userSessions->isNotEmpty()) {
                // If any session is approved/present, mark as such
                if ($userSessions->contains('attendance_status', StaffSession::ATTENDANCE_APPROVED)) {
                    $status = StaffSession::ATTENDANCE_APPROVED;
                } elseif ($userSessions->contains('attendance_status', StaffSession::ATTENDANCE_PRESENT)) {
                    $status = StaffSession::ATTENDANCE_PRESENT;
                } elseif ($userSessions->contains('attendance_status', StaffSession::ATTENDANCE_REJECTED)) {
                    $status = StaffSession::ATTENDANCE_REJECTED;
                }
            }

            return [
                'user_id' => $user->id,
                'user_name' => $user->user_name,
                'full_name' => $user->staffDetail?->full_name ?? $user->user_name,
                'avatar' => $user->avatar_url,
                'is_online' => $isOnline,
                'sessions_count' => $userSessions->count(),
                'first_login' => $firstSession?->login_at?->toIso8601String(),
                'last_logout' => $userSessions->where('status', StaffSession::STATUS_CLOSED)->max('logout_at')?->toIso8601String(),
                'total_worked_minutes' => $totalMinutes,
                'total_worked_hours' => round($totalMinutes / 60, 2),
                'attendance_status' => $status,
                'current_session_status' => $lastSession ? $lastSession->status : null,
            ];
        })->values();


        return $this->success([

            'date' => $date,
            'total_staff' => $users->count(),
            'total_staff_present' => $report->where('sessions_count', '>', 0)->count(),
            'report' => $report,
        ], 'Attendance report generated successfully');

    }

    /**
     * Get session summary statistics for a specific user (for managers)
     * Shows login count, average duration, etc.
     */
    public function getUserSessionSummary(Request $request, $userId)
    {
        if (!$request->user()->hasPermissionTo('staff.view')) {
            return $this->forbidden('Permission denied');
        }

        $user = User::find($userId);
        if (!$user) {
            return $this->notFound('User not found');
        }

        // Get current month dates (calendar month)
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();
        
        // Get current week dates
        $weekStart = now()->startOfWeek()->toDateString();
        $weekEnd = now()->endOfWeek()->toDateString();

        // Total logins (all time)
        $totalLogins = StaffSession::where('user_id', $userId)->count();
        
        // This month logins
        $monthLogins = StaffSession::where('user_id', $userId)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->count();
        
        // This week logins
        $weekLogins = StaffSession::where('user_id', $userId)
            ->whereBetween('date', [$weekStart, $weekEnd])
            ->count();
        
        // Total worked minutes this month
        $monthWorkedMinutes = StaffSession::where('user_id', $userId)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->where('status', StaffSession::STATUS_CLOSED)
            ->sum('worked_minutes');
        
        // Average session duration (from closed sessions)
        $avgDuration = StaffSession::where('user_id', $userId)
            ->where('status', StaffSession::STATUS_CLOSED)
            ->where('worked_minutes', '>', 0)
            ->avg('worked_minutes') ?? 0;
        
        // Last session info
        $lastSession = StaffSession::where('user_id', $userId)
            ->orderBy('login_at', 'desc')
            ->first();
        
        // Current session (if any)
        $currentSession = StaffSession::where('user_id', $userId)
            ->where('status', StaffSession::STATUS_OPEN)
            ->first();
        
        // Calculate current session duration if logged in
        $currentDuration = 0;
        $isCurrentlyLoggedIn = false;
        if ($currentSession) {
            $isCurrentlyLoggedIn = true;
            $currentDuration = $currentSession->login_at->diffInMinutes(now());
        }

        return $this->success([
            'user_id' => $userId,
            'total_logins' => $totalLogins,
            'total_logins_this_month' => $monthLogins,
            'total_logins_this_week' => $weekLogins,
            'total_worked_minutes_this_month' => (int) $monthWorkedMinutes,
            'total_worked_hours_this_month' => round($monthWorkedMinutes / 60, 2),
            'average_session_duration_minutes' => (int) round($avgDuration),
            'average_session_duration_hours' => round($avgDuration / 60, 2),
            'last_login_at' => $lastSession?->login_at?->toIso8601String(),
            'last_logout_at' => $lastSession?->logout_at?->toIso8601String(),
            'is_currently_logged_in' => $isCurrentlyLoggedIn,
            'current_session_duration_minutes' => $currentDuration,
            'month_period' => [
                'start' => $monthStart,
                'end' => $monthEnd,
            ],
        ], 'User session summary retrieved successfully');
    }

    /**
     * Get session history for a specific user with date filtering (for managers)
     * Returns paginated sessions with load more support
     */
    public function getUserSessionHistory(Request $request, $userId)
    {
        if (!$request->user()->hasPermissionTo('staff.view')) {
            return $this->forbidden('Permission denied');
        }

        $request->validate([
            'start_date' => 'nullable|date|date_format:Y-m-d',
            'end_date' => 'nullable|date|date_format:Y-m-d|after_or_equal:start_date',
            'limit' => 'nullable|integer|min:5|max:50',
            'offset' => 'nullable|integer|min:0',
        ]);

        $user = User::find($userId);
        if (!$user) {
            return $this->notFound('User not found');
        }

        $limit = $request->limit ?? 10;
        $offset = $request->offset ?? 0;

        $query = StaffSession::where('user_id', $userId);

        // Apply date filters
        if ($request->start_date) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->where('date', '<=', $request->end_date);
        }

        // Get total count for pagination
        $totalCount = $query->count();

        // Get sessions with pagination (offset-based for load more)
        $sessions = $query->orderBy('date', 'desc')
            ->orderBy('login_at', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get();

        // Calculate summary for the filtered period
        $summaryQuery = StaffSession::where('user_id', $userId);
        if ($request->start_date) {
            $summaryQuery->where('date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $summaryQuery->where('date', '<=', $request->end_date);
        }
        
        $totalMinutes = (clone $summaryQuery)
            ->where('status', StaffSession::STATUS_CLOSED)
            ->sum('worked_minutes');

        return $this->success([
            'user' => [
                'id' => $user->id,
                'user_name' => $user->user_name,
                'full_name' => $user->staffDetail?->full_name ?? $user->user_name,
            ],
            'sessions' => $sessions->map(fn ($s) => $this->formatSession($s)),
            'pagination' => [
                'total' => $totalCount,
                'offset' => $offset,
                'limit' => $limit,
                'has_more' => ($offset + $limit) < $totalCount,
            ],
            'period_summary' => [
                'total_sessions' => $totalCount,
                'total_worked_minutes' => (int) $totalMinutes,
                'total_worked_hours' => round($totalMinutes / 60, 2),
            ],
        ], 'User session history retrieved successfully');
    }

    /**
     * Mark/Update attendance manually (for managers)
     */
    public function markAttendance(Request $request)
    {
        if (!$request->user()->hasPermissionTo('attendance.approve')) {
            return $this->forbidden('Permission denied');
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date|date_format:Y-m-d',
            'status' => 'nullable|string|in:Present,Absent,Half Day,Leave,Not Marked',
            'checkIn' => 'nullable|string|date_format:H:i',
            'checkOut' => 'nullable|string|date_format:H:i|after_or_equal:checkIn',
            'remarks' => 'nullable|string|max:500',
        ]);

        $userId = $request->user_id;
        $date = Carbon::parse($request->date);
        
        // Find existing session for this date
        $session = StaffSession::where('user_id', $userId)
            ->where('date', $date->toDateString())
            ->first();

        $data = [
            'remarks' => $request->remarks,
            'attendance_status' => StaffSession::ATTENDANCE_APPROVED, // Manually marked is auto-approved
        ];

        if ($request->checkIn) {
            $data['login_at'] = Carbon::parse($date->toDateString() . ' ' . $request->checkIn);
        }

        if ($request->checkOut) {
            $data['logout_at'] = Carbon::parse($date->toDateString() . ' ' . $request->checkOut);
        }

        if ($session) {
            // Update existing
            $session->update($data);
            if ($session->login_at && $session->logout_at) {
                $session->update([
                    'worked_minutes' => $session->login_at->diffInMinutes($session->logout_at),
                    'status' => StaffSession::STATUS_CLOSED
                ]);
            }
        } else {
            // Create new
            $data['user_id'] = $userId;
            $data['date'] = $date->toDateString();
            $data['status'] = ($request->checkIn && $request->checkOut) ? StaffSession::STATUS_CLOSED : StaffSession::STATUS_OPEN;
            
            if (!$request->checkIn) {
                $data['login_at'] = Carbon::parse($date->toDateString() . ' 08:30:00'); // Default checkin
            }

            $session = StaffSession::create($data);
            
            if ($session->login_at && $session->logout_at) {
                $session->update([
                    'worked_minutes' => $session->login_at->diffInMinutes($session->logout_at)
                ]);
            }
        }

        return $this->success([
            'session' => $this->formatSessionWithUser($session),
        ], 'Attendance marked successfully');
    }

    // ==================== HELPER METHODS ====================

    /**
     * Format session for API response
     */
    private function formatSession(StaffSession $session): array
    {
        return [
            'id' => $session->id,
            'user_id' => $session->user_id,
            'date' => $session->date->toDateString(),
            'login_at' => $session->login_at?->toIso8601String(),
            'logout_at' => $session->logout_at?->toIso8601String(),
            'logout_type' => $session->logout_type,
            'auto_logged_out' => $session->auto_logged_out,
            'status' => $session->status,
            'worked_minutes' => $session->worked_minutes,
            'worked_hours' => round($session->worked_minutes / 60, 2),
            'attendance_status' => $session->attendance_status,
            'approved_by' => $session->approved_by,
            'approved_at' => $session->approved_at?->toIso8601String(),
            'remarks' => $session->remarks,
            'login_ip' => $session->login_ip,
        ];
    }

    /**
     * Format session with user details for API response
     */
    private function formatSessionWithUser(StaffSession $session): array
    {
        $formatted = $this->formatSession($session);
        
        if ($session->user) {
            $formatted['user'] = [
                'id' => $session->user->id,
                'user_name' => $session->user->user_name,
                'full_name' => $session->user->staffDetail?->full_name ?? $session->user->user_name,
            ];
        }

        if ($session->approver) {
            $formatted['approver'] = [
                'id' => $session->approver->id,
                'user_name' => $session->approver->user_name,
            ];
        }

        return $formatted;
    }
}

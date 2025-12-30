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
        if (!$request->user()->hasPermissionTo('attendance.view_reports')) {
            return $this->forbidden('Permission denied');
        }

        $request->validate([
            'date' => 'required|date|date_format:Y-m-d',
        ]);

        $date = $request->date;

        // Get all sessions for the date
        $sessions = StaffSession::with(['user', 'user.staffDetail'])
            ->where('date', $date)
            ->orderBy('login_at')
            ->get();

        // Group by user
        $grouped = $sessions->groupBy('user_id')->map(function ($userSessions, $userId) {
            $user = $userSessions->first()->user;
            $totalMinutes = $userSessions->where('status', StaffSession::STATUS_CLOSED)->sum('worked_minutes');
            
            return [
                'user_id' => $userId,
                'user_name' => $user->user_name,
                'full_name' => $user->staffDetail?->full_name ?? $user->user_name,
                'sessions_count' => $userSessions->count(),
                'first_login' => $userSessions->min('login_at'),
                'last_logout' => $userSessions->max('logout_at'),
                'total_worked_minutes' => $totalMinutes,
                'total_worked_hours' => round($totalMinutes / 60, 2),
                'attendance_status' => $userSessions->first()->attendance_status,
            ];
        })->values();

        return $this->success([
            'date' => $date,
            'total_staff_present' => $grouped->count(),
            'report' => $grouped,
        ], 'Attendance report generated successfully');
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

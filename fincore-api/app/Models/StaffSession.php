<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffSession extends Model
{
    protected $table = 'staff_sessions';

    /**
     * Logout type constants
     */
    const LOGOUT_TYPE_LOGOUT = 'LOGOUT';
    const LOGOUT_TYPE_ON_WORK = 'ON_WORK';
    const LOGOUT_TYPE_STAY_IN_OFFICE = 'STAY_IN_OFFICE';
    const LOGOUT_TYPE_AUTO_LOGOUT = 'AUTO_LOGOUT';

    /**
     * Session status constants
     */
    const STATUS_OPEN = 'OPEN';
    const STATUS_CLOSED = 'CLOSED';

    /**
     * Attendance status constants
     */
    const ATTENDANCE_PRESENT = 'PRESENT';
    const ATTENDANCE_PENDING = 'PENDING';
    const ATTENDANCE_APPROVED = 'APPROVED';
    const ATTENDANCE_REJECTED = 'REJECTED';

    protected $fillable = [
        'user_id',
        'date',
        'login_at',
        'logout_at',
        'logout_type',
        'auto_logged_out',
        'status',
        'worked_minutes',
        'attendance_status',
        'approved_by',
        'approved_at',
        'remarks',
        'login_ip',
        'user_agent',
    ];

    protected $casts = [
        'date' => 'date',
        'login_at' => 'datetime',
        'logout_at' => 'datetime',
        'approved_at' => 'datetime',
        'auto_logged_out' => 'boolean',
        'worked_minutes' => 'integer',
    ];

    /**
     * Get the user that owns this session
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the manager/admin who approved the attendance
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Check if the session is open
     */
    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    /**
     * Check if the session is closed
     */
    public function isClosed(): bool
    {
        return $this->status === self::STATUS_CLOSED;
    }

    /**
     * Check if logout type permanently closes session
     */
    public static function isClosingLogoutType(string $logoutType): bool
    {
        return in_array($logoutType, [self::LOGOUT_TYPE_LOGOUT, self::LOGOUT_TYPE_AUTO_LOGOUT]);
    }

    /**
     * Calculate worked minutes from login to logout
     */
    public function calculateWorkedMinutes(): int
    {
        if (!$this->logout_at || !$this->login_at) {
            return 0;
        }

        return $this->login_at->diffInMinutes($this->logout_at);
    }

    /**
     * Close the session with a specific logout type
     */
    public function closeSession(string $logoutType, bool $autoLoggedOut = false): void
    {
        $now = now();
        
        $this->update([
            'logout_at' => $now,
            'logout_type' => $logoutType,
            'auto_logged_out' => $autoLoggedOut,
            'status' => self::isClosingLogoutType($logoutType) ? self::STATUS_CLOSED : self::STATUS_OPEN,
            'worked_minutes' => $this->login_at->diffInMinutes($now),
        ]);
    }

    /**
     * Scope to get open sessions for a user
     */
    public function scopeOpenForUser($query, int $userId)
    {
        return $query->where('user_id', $userId)
                    ->where('status', self::STATUS_OPEN);
    }

    /**
     * Scope to get sessions for today
     */
    public function scopeToday($query)
    {
        return $query->where('date', today());
    }

    /**
     * Scope to get sessions for a specific date
     */
    public function scopeForDate($query, $date)
    {
        return $query->where('date', $date);
    }

    /**
     * Scope to get closed sessions
     */
    public function scopeClosed($query)
    {
        return $query->where('status', self::STATUS_CLOSED);
    }

    /**
     * Scope to get sessions pending approval
     */
    public function scopePendingApproval($query)
    {
        return $query->where('attendance_status', self::ATTENDANCE_PENDING);
    }

    /**
     * Get total worked minutes for a user on a specific date
     */
    public static function getTotalWorkedMinutesForDate(int $userId, $date): int
    {
        return self::where('user_id', $userId)
                   ->where('date', $date)
                   ->where('status', self::STATUS_CLOSED)
                   ->sum('worked_minutes');
    }

    /**
     * Check if user has any session on a specific date
     */
    public static function hasSessionOnDate(int $userId, $date): bool
    {
        return self::where('user_id', $userId)
                   ->where('date', $date)
                   ->exists();
    }
}

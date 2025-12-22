<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\PersonalAccessToken;
use App\Traits\UserMethods;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes, UserMethods;

    protected $fillable = [
        'user_name',
        'email',
        'password',
        'digital_signature',
        'is_active',
        'avatar',
        'last_login_at',
        'last_login_ip',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'failed_login_attempts',
        'locked_until',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'last_login_at' => 'datetime',
        'locked_until' => 'datetime',
        'failed_login_attempts' => 'integer',
        'two_factor_confirmed_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'full_name',
        'initials',
        'avatar_url',
        'is_locked',
        'has_two_factor',
    ];

    // Relationships
    public function staffDetail()
    {
        return $this->hasOne(StaffDetail::class);
    }

    public function personalAccessTokens()
    {
        return $this->hasMany(PersonalAccessToken::class, 'tokenable_id');
    }

    // Attributes
    public function getFullNameAttribute()
    {
        return $this->user_name;
    }

    public function getInitialsAttribute()
    {
        $words = explode(' ', $this->user_name);
        $initials = '';
        
        foreach ($words as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
        
        return substr($initials, 0, 2);
    }

    public function getAvatarUrlAttribute()
    {
        if ($this->avatar) {
            return asset('storage/avatars/' . $this->avatar);
        }
        
        // Generate initials avatar
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->user_name) . '&color=7F9CF5&background=EBF4FF';
    }

    public function getIsLockedAttribute()
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    public function getHasTwoFactorAttribute()
    {
        return !empty($this->two_factor_secret);
    }

    // ========== MISSING METHODS ADDED BELOW ==========

    /**
     * Get all permission names as array
     */
    public function getAllPermissionNames(): array
    {
        return $this->getAllPermissions()->pluck('name')->toArray();
    }

    /**
     * Get role names as array
     */
    public function getRoleNamesArray(): array
    {
        return $this->getRoleNames()->toArray();
    }

    /**
     * Get direct permission names (not through roles)
     */
    public function getDirectPermissionNames(): array
    {
        return $this->permissions()->pluck('name')->toArray();
    }

    /**
     * Get all permissions including through roles
     */
    public function getAllPermissionsWithSource()
    {
        $allPermissions = collect();
        
        // Get permissions through roles
        foreach ($this->roles as $role) {
            foreach ($role->permissions as $permission) {
                $allPermissions->push([
                    'permission' => $permission,
                    'source' => 'role',
                    'role_name' => $role->name,
                    'role_id' => $role->id,
                ]);
            }
        }
        
        // Get direct permissions
        foreach ($this->permissions as $permission) {
            $allPermissions->push([
                'permission' => $permission,
                'source' => 'direct',
                'role_name' => null,
                'role_id' => null,
            ]);
        }
        
        return $allPermissions->unique('permission.id');
    }

    /**
     * Check if user has specific permission (including through roles)
     */
    public function hasPermission($permissionName): bool
    {
        return $this->hasPermissionTo($permissionName);
    }

    /**
     * Check if user has any of the given permissions
     */
    public function hasAnyPermission(array $permissionNames): bool
    {
        foreach ($permissionNames as $permissionName) {
            if ($this->hasPermissionTo($permissionName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all of the given permissions
     */
    public function hasAllPermissions(array $permissionNames): bool
    {
        foreach ($permissionNames as $permissionName) {
            if (!$this->hasPermissionTo($permissionName)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get current access token
     */
    // Add to User model if still having issues
    public function currentAccessToken()
    {
        // Check if we already have the token cached
        if (isset($this->accessToken)) {
            return $this->accessToken;
        }
        
        // Get the current token from Sanctum
        return $this->tokens()->where('name', 'auth_token')->latest()->first();
    }

    public function withAccessToken($accessToken)
    {
        $this->accessToken = $accessToken;
        return $this;
    }

    /**
     * Create authentication token
     */
    public function createAuthToken()
    {
        return $this->createToken('auth_token')->plainTextToken;
    }

    /**
     * Revoke all tokens
     */
    public function revokeAllTokens()
    {
        $this->tokens()->delete();
    }

    /**
     * Revoke current token
     */
    public function revokeCurrentToken()
    {
        $token = $this->currentAccessToken();
        if ($token) {
            $token->delete();
        }
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Record successful login
     */
    public function recordLogin($ip): void
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
    }

    /**
     * Record failed login attempt
     */
    public function recordFailedLogin(): void
    {
        $attempts = $this->failed_login_attempts + 1;
        
        $this->update([
            'failed_login_attempts' => $attempts,
        ]);
        
        // Lock account after 5 failed attempts
        if ($attempts >= 5) {
            $this->update([
                'locked_until' => now()->addMinutes(30),
            ]);
        }
    }

    /**
     * Unlock user account
     */
    public function unlockAccount(): void
    {
        $this->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
    }

    /**
     * Activate user account
     */
    public function activate(): void
    {
        $this->update(['is_active' => true]);
    }

    /**
     * Deactivate user account
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    /**
     * Get user's permissions grouped by module
     */
    public function getPermissionsByModule(): array
    {
        $permissions = $this->getAllPermissions();
        
        $grouped = [];
        foreach ($permissions as $permission) {
            $module = $permission->module ?? 'other';
            if (!isset($grouped[$module])) {
                $grouped[$module] = [];
            }
            $grouped[$module][] = $permission->name;
        }
        
        return $grouped;
    }

    /**
     * Check if user can perform action based on permission
     */
    public function canDo($action, $module = null): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        
        $permissionName = $module ? "{$module}.{$action}" : $action;
        return $this->hasPermissionTo($permissionName);
    }

    /**
     * Get user's role hierarchy level
     */
    public function getRoleHierarchy(): int
    {
        $highestRole = $this->roles()->orderBy('hierarchy')->first();
        return $highestRole ? $highestRole->hierarchy : 1000;
    }

    /**
     * Check if user can manage another user based on hierarchy
     */
    public function canManageUser(User $otherUser): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        
        return $this->getRoleHierarchy() < $otherUser->getRoleHierarchy();
    }
}
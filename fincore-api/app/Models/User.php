<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar',
        'status',
        'last_login_at',
        'last_login_ip',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'login_attempts',
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
        'login_attempts' => 'integer',
        'two_factor_confirmed_at' => 'datetime',
        'custom_fields' => 'array',
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

    // Attributes
    public function getFullNameAttribute()
    {
        return $this->name;
    }

    public function getInitialsAttribute()
    {
        $words = explode(' ', $this->name);
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
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=7F9CF5&background=EBF4FF';
    }

    public function getIsLockedAttribute()
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    public function getHasTwoFactorAttribute()
    {
        return !empty($this->two_factor_secret);
    }

    // Methods - Use different names to avoid conflicts
    public function getAllPermissionNames()
    {
        return $this->getAllPermissions()->pluck('name')->toArray();
    }

    public function getRoleNamesArray()
    {
        return $this->getRoleNames()->toArray();
    }

    public function getDirectPermissionNames()
    {
        return $this->permissions->pluck('name')->toArray();
    }

    public function isSuperAdmin()
    {
        return $this->hasRole('super_admin');
    }

    public function isAdmin()
    {
        return $this->hasRole('admin');
    }

    public function recordLogin($ip)
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
            'login_attempts' => 0,
            'locked_until' => null,
        ]);
    }

    public function recordFailedLogin()
    {
        $attempts = $this->login_attempts + 1;
        
        $this->update([
            'login_attempts' => $attempts,
        ]);
        
        // Lock account after 5 failed attempts
        if ($attempts >= 5) {
            $this->update([
                'locked_until' => now()->addMinutes(30),
            ]);
        }
    }

    public function unlockAccount()
    {
        $this->update([
            'login_attempts' => 0,
            'locked_until' => null,
        ]);
    }
}
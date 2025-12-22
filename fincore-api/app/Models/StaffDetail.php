<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffDetail extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'employee_id',
        'designation',
        'department',
        'phone', // Add phone here since removed from users table
        'joining_date',
        'leaving_date',
        'salary',
        'employment_type',
        'reporting_to',
        'bank_name',
        'bank_account_number',
        'pan_number',
        'aadhar_number',
        'uan_number',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'notes',
        'custom_fields',
    ];

    protected $casts = [
        'joining_date' => 'date',
        'leaving_date' => 'date',
        'salary' => 'decimal:2',
        'custom_fields' => 'array',
    ];

    protected $appends = [
        'employment_status',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Attributes
    public function getEmploymentStatusAttribute()
    {
        if ($this->leaving_date && $this->leaving_date->isPast()) {
            return 'left';
        }
        
        if ($this->employment_type === 'probation') {
            return 'probation';
        }
        
        return $this->employment_type;
    }

    public function getReportingManagerAttribute()
    {
        if ($this->reporting_to) {
            return User::where('employee_id', $this->reporting_to)->first();
        }
        
        return null;
    }
}
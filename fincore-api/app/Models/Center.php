<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Center extends Model
{
    protected $fillable = [
        'CSU_id',
        'open_days',
        'branch_id',
        'center_name',
        'location',
        'address',
        'staff_id',
        'group_count',
        'status',
        'rejection_reason',
    ];

    protected $casts = [
        'open_days' => 'array',
        'group_count' => 'integer',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }

    public function groups()
    {
        return $this->hasMany(Group::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = [
        'branch_id',
        'branch_name',
        'location',
        'address',
        'city',
        'province',
        'postal_code',
        'phone',
        'email',
        'manager_name',
        'staff_ids',
        'status'
    ];

    protected $casts = [
        'staff_ids' => 'array',
    ];

    public function manager()
    {
        return $this->hasOne(Staff::class, 'branch_id')->where('work_info->designation', 'manager');
    }

    public function customers()
    {
        return $this->hasMany(Customer::class, 'branch_id');
    }

    public function loans()
    {
        return $this->hasManyThrough(
            Loan::class,
            Center::class,
            'branch_id', // Foreign key on centers table...
            'CSU_id',    // Foreign key on loans table...
            'id',        // Local key on branches table...
            'id'         // Local key on centers table...
        );
    }
}

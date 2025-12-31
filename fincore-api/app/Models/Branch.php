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
    ];

    protected $casts = [
        'staff_ids' => 'array',
    ];

    public function manager()
    {
        return $this->hasOne(Staff::class, 'branch_id')->where('work_info->designation', 'manager');
    }
}

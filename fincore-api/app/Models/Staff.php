<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $table = 'staffs';

    // ✅ IMPORTANT FOR OPTION 2
    protected $primaryKey = 'staff_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'staff_id',
        'email_id',
        'account_status',
        'contact_no',
        'full_name',
        'name_with_initial',
        'address',
        'nic',
        'work_info',
        'age',
        'profile_image',
        'gender',
        'monthly_target_amount',
        'monthly_target_count',
        'companies',
        'basic_salary',
        'leave_details',
        'branch_id',
        'center_id',
    ];

    protected $casts = [
        'companies' => 'array',
        'leave_details' => 'array',
        'work_info' => 'array',
        'monthly_target_amount' => 'decimal:2',
        'basic_salary' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}

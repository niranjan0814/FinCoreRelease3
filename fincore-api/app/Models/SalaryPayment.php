<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'staff_id',
        'payment_date',
        'month',
        'base_salary',
        'allowances',
        'deductions',
        'net_payable',
        'status',
        'payment_method',
        'allowances_detail',
        'notes',
        'processed_by'
    ];

    protected $casts = [
        'payment_date' => 'date',
        'allowances_detail' => 'array',
        'base_salary' => 'decimal:2',
        'allowances' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_payable' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}

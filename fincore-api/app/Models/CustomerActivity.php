<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerActivity extends Model
{
    protected $fillable = [
        'customer_id',
        'staff_id',
        'activity_type',
        'description',
        'customer_behavior',
        'outcome',
        'activity_date',
    ];

    protected $casts = [
        'activity_date' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}

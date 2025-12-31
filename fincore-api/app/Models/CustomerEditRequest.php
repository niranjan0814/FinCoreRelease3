<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerEditRequest extends Model
{
    protected $fillable = [
        'customer_id',
        'requested_by',
        'old_data',
        'new_data',
        'status',
        'approved_by',
        'rejection_reason'
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

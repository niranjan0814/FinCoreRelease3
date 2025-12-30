<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CenterChangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'current_center_id',
        'requested_center_id',
        'reason',
        'status',
        'requested_by',
        'approved_by',
        'approved_at',
        'remarks',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function currentCenter()
    {
        return $this->belongsTo(Center::class, 'current_center_id');
    }

    public function requestedCenter()
    {
        return $this->belongsTo(Center::class, 'requested_center_id');
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

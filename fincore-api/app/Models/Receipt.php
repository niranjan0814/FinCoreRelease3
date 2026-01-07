<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Receipt extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'receipt_id',
        'staff_id',
        'digital_sign',
        'center_id',
        'group_id',
        'customer_id',
        'loan_id',
        'current_due',
        'current_due_amount',
        'current_balance_amount',
        'copy_count',
        'status',
        'comments',
        'cancellation_reason',
        'cancellation_requested_by',
        'cancellation_approved_by',
        'cancellation_approved_at',
    ];

    // Relationships
    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id'); // Assuming staff refers to User model
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'cancellation_requested_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'cancellation_approved_by');
    }

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * Get the ledger transaction associated with the receipt.
     */
    public function transaction()
    {
        return $this->hasOne(Transaction::class, 'related_id')->where('category', 'collection');
    }
}

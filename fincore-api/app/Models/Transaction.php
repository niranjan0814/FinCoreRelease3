<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_id',
        'amount',
        'type',
        'category',
        'related_id',
        'status',
        'soap_ref_no',
        'digital_sign',
        'refund_amount',
        'refund_reason',
        'bank_details',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'bank_details' => 'array',
    ];

    /**
     * Get the staff responsible for the transaction.
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }

    /**
     * Get the associated branch expense if applicable.
     */
    public function branchExpense()
    {
        return $this->hasOne(BranchExpense::class);
    }
}

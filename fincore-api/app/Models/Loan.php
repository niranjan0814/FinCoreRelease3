<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Loan extends Model
{
    use HasFactory;

    protected $table = 'loans';

    protected $fillable = [
        'product_id',
        'CSU_id',
        'staff_id',
        'loan_id',
        'agreement_date',
        'customer_id',
        'group_id',
        'request_amount',
        'approved_amount',
        'loan_step',
        'status',
        'terms',
        'interest_rate',
        'end_term',
        'outstanding_amount',
        'interest_rate_annum',
        'interest_rate_week',
        'service_charge',
        'document_charge',
        'rentel',
        'borrower_bank_details',
        'joint_borrow',
        'g1_details',
        'g2_details',
        'w1_details',
        'w2_details',
        'fuil_amount',
        'bank_transfer_amount',
        'approve_history',
        'reduce_presenence_in_interest',
        'reduce_presentence_in_capital',
        'document_id',
        'guardian_nic',
        'guardian_name',
        'guardian_address',
        'guardian_phone',
    ];

    protected $casts = [
        'agreement_date' => 'date',
        'end_term' => 'date',
        'request_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'outstanding_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'interest_rate_annum' => 'decimal:2',
        'interest_rate_week' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'document_charge' => 'decimal:2',
        'rentel' => 'decimal:2',
        'fuil_amount' => 'decimal:2',
        'bank_transfer_amount' => 'decimal:2',
        'reduce_presenence_in_interest' => 'decimal:2',
        'reduce_presentence_in_capital' => 'decimal:2',
        'borrower_bank_details' => 'array',
        'g1_details' => 'array',
        'g2_details' => 'array',
        'w1_details' => 'array',
        'w2_details' => 'array',
        'approve_history' => 'array',
        'joint_borrow' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(LoanProduct::class, 'product_id');
    }

    public function center()
    {
        return $this->belongsTo(Center::class, 'CSU_id');
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function group()
    {
        return $this->belongsTo(Group::class, 'group_id');
    }
}

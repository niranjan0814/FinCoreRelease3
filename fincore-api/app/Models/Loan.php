<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Loan extends Model
{
    use HasFactory;

    protected $table = 'loans';

    // ============================================
    // LOAN STATUS CONSTANTS
    // ============================================
    // Approval Workflow Statuses
    const STATUS_PENDING_1ST = 'pending_1st';      // Awaiting 1st level approval
    const STATUS_PENDING_2ND = 'pending_2nd';      // Awaiting 2nd level approval (for loans >= 200,000)
    const STATUS_APPROVED = 'approved';            // Fully approved, ready for disbursement
    const STATUS_SENT_BACK = 'sent_back';          // Returned to field officer for corrections

    // Loan Lifecycle Statuses
    const STATUS_ACTIVE = 'Active';                // Disbursed and currently being collected
    const STATUS_COMPLETED = 'Completed';          // Fully paid off
    const STATUS_REJECTED = 'Rejected';            // Permanently rejected

    // All Possible Statuses
    const STATUSES = [
        self::STATUS_PENDING_1ST,
        self::STATUS_PENDING_2ND,
        self::STATUS_APPROVED,
        self::STATUS_SENT_BACK,
        self::STATUS_ACTIVE,
        self::STATUS_COMPLETED,
        self::STATUS_REJECTED,
    ];

    // Statuses considered "active" (loan is ongoing)
    const ACTIVE_STATUSES = [
        self::STATUS_PENDING_1ST,
        self::STATUS_PENDING_2ND,
        self::STATUS_APPROVED,
        self::STATUS_SENT_BACK,
        self::STATUS_ACTIVE,
    ];

    // Statuses considered "closed" (loan is finished)
    const CLOSED_STATUSES = [
        self::STATUS_COMPLETED,
        self::STATUS_REJECTED,
    ];

    // Status display labels for UI
    const STATUS_LABELS = [
        self::STATUS_PENDING_1ST => 'Pending 1st Approval',
        self::STATUS_PENDING_2ND => 'Pending 2nd Approval',
        self::STATUS_APPROVED => 'Approved',
        self::STATUS_SENT_BACK => 'Sent Back',
        self::STATUS_ACTIVE => 'Active',
        self::STATUS_COMPLETED => 'Completed',
        self::STATUS_REJECTED => 'Rejected',
    ];

    /**
     * Get the display label for the current status.
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? ucfirst(str_replace('_', ' ', $this->status));
    }

    /**
     * Check if the loan is in an active/ongoing state.
     */
    public function isActive(): bool
    {
        return in_array($this->status, self::ACTIVE_STATUSES);
    }

    /**
     * Check if the loan is closed (completed or rejected).
     */
    public function isClosed(): bool
    {
        return in_array($this->status, self::CLOSED_STATUSES);
    }

    protected $fillable = [
        'product_id',
        'CSU_id',
        'staff_id',
        'loan_id',
        'agreement_date',
        'activation_date',
        'first_due_date',
        'due_day',
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
        'suspense_balance',
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
        'rejection_reason',
    ];

    protected $casts = [
        'agreement_date' => 'date',
        'activation_date' => 'date',
        'first_due_date' => 'date',
        'due_day' => 'integer',
        'end_term' => 'date',
        'request_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'outstanding_amount' => 'decimal:2',
        'suspense_balance' => 'decimal:2',
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

    public function payments()
    {
        return $this->hasMany(CustomerLoanPayment::class, 'loan_id');
    }

    public function latestPayment()
    {
        return $this->hasOne(CustomerLoanPayment::class, 'loan_id')
            ->where('status', '!=', 'cancelled')
            ->latestOfMany();
    }

    public function extensions()
    {
        return $this->hasMany(LoanDueDateExtension::class, 'loan_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CustomerLoanPayment extends Model
{
    use HasFactory;

    protected $table = 'customer_loan_payment';

    protected $fillable = [
        'customer_id',
        'loan_id',
        'receipt_id',
        'last_payment_amount',
        'last_payment_date',
        'full_balance',
        'current_balance_amount',
        'current_capital_balance',
        'current_balance_interest',
        'interest_amount',
        'rental_amount',
        'total_due',
        'remained_due',
        'arrears',
        'suspense_generated',
        'suspense_used',
        'arrears_age',
    ];

    protected $casts = [
        'last_payment_amount' => 'decimal:2',
        'last_payment_date' => 'date',
        'full_balance' => 'decimal:2',
        'current_balance_amount' => 'decimal:2',
        'current_capital_balance' => 'decimal:2',
        'current_balance_interest' => 'decimal:2',
        'interest_amount' => 'decimal:2',
        'rental_amount' => 'decimal:2',
        'total_due' => 'decimal:2',
        'remained_due' => 'decimal:2',
        'arrears' => 'decimal:2',
        'suspense_generated' => 'decimal:2',
        'suspense_used' => 'decimal:2',
        'arrears_age' => 'integer',
    ];

    /**
     * Get the customer that owns the payment.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * Get the loan that owns the payment.
     */
    public function loan()
    {
        return $this->belongsTo(Loan::class, 'loan_id');
    }

    /**
     * Get the receipt for the payment.
     */
    public function receipt()
    {
        return $this->belongsTo(Receipt::class, 'receipt_id');
    }

    /**
     * Scope to get latest payment per loan.
     */
    public function scopeLatestPerLoan($query)
    {
        return $query->whereIn('id', function ($subQuery) {
            $subQuery->selectRaw('MAX(id)')
                ->from('customer_loan_payment')
                ->groupBy('loan_id');
        });
    }

    /**
     * Scope to filter by center (CSU).
     */
    public function scopeByCenter($query, $csuId)
    {
        return $query->whereHas('loan', function ($q) use ($csuId) {
            $q->where('CSU_id', $csuId);
        });
    }

    /**
     * Scope to filter by payment date.
     */
    public function scopeByPaymentDate($query, $date)
    {
        return $query->whereDate('last_payment_date', $date);
    }

    /**
     * Calculate if payment is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->arrears > 0;
    }
}

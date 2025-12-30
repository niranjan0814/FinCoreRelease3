<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanProduct extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'loan_products';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'product_name',
        'product_details',
        'term_type',
        'regacine',
        'interest_rate',
        'loan_limited_amount',
        'loan_amount',
        'loan_term',
        'customer_age_limited',
        'customer_monthly_income',
        'guarantor_monthly_income',
        'status',
        'approval_level',
        'customer_id',
    ];

    /**
     * Get the customer associated with the loan product.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'interest_rate' => 'decimal:2',
        'loan_limited_amount' => 'decimal:2',
        'loan_amount' => 'decimal:2',
        'loan_term' => 'integer',
        'customer_age_limited' => 'integer',
        'customer_monthly_income' => 'decimal:2',
        'guarantor_monthly_income' => 'decimal:2',
    ];
}

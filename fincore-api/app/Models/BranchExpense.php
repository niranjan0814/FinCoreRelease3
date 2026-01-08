<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BranchExpense extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'transaction_id',
        'type',
        'date',
        'expense_type',
        'medium',
        'description',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * Get the branch associated with the expense.
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the ledger transaction associated with the expense.
     */
    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}

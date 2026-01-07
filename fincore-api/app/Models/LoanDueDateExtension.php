<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanDueDateExtension extends Model
{
    use HasFactory;

    protected $table = 'loan_due_date_extensions';

    protected $fillable = [
        'loan_id',
        'action_type',
        'original_due_date',
        'new_due_date',
        'reason',
        'created_by',
    ];

    protected $casts = [
        'original_due_date' => 'date',
        'new_due_date' => 'date',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

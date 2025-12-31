<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shareholder extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'shares',
        'percentage',
        'total_investment',
        'nic',
        'contact',
        'address',
    ];

    protected $casts = [
        'shares' => 'integer',
        'percentage' => 'float',
        'total_investment' => 'float',
    ];
}

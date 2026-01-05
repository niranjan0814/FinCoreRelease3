<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Group extends Model
{

    protected $fillable = [
        'group_name',
        'center_id',
        'customer_ids',
        'status',
    ];


    protected $casts = [
        'customer_ids' => 'array',
    ];
    
    protected $with = ['customers.center', 'customers.branch', 'customers.loans'];

    public function center()
    {
        return $this->belongsTo(\App\Models\Center::class);
    }

    public function customers()
    {
        return $this->hasMany(\App\Models\Customer::class, 'grp_id');
    }

    public function loans()
    {
        return $this->hasMany(\App\Models\Loan::class, 'group_id');
    }
}

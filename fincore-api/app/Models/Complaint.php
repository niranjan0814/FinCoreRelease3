<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Complaint extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ticket_no',
        'complainant_name',
        'complainant_type',
        'branch_name',
        'category',
        'subject',
        'description',
        'priority',
        'status',
        'assigned_to',
        'resolution',
        'assigner_id',
        'assigner_name',
        'assignee_id',
        'assignee_name',
    ];

    // Optional: Cast attributes if needed
    // protected $casts = [];
}

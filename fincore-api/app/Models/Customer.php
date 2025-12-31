<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class Customer extends Model
{
    // Sri Lankan Location Constants
    const COUNTRY = 'Sri Lanka';
    
    // Code Type Enum - Only NIC is supported
    const CODE_TYPE = 'NIC';
    
    // Religion Enum - Common religions in Sri Lanka
    const RELIGIONS = [
        'Buddhism',
        'Hinduism',
        'Islam',
        'Christianity',
        'Roman Catholic',
        'Other',
    ];
    
    // Age Restrictions for Loan Eligibility
    const MIN_AGE = 18; // Minimum age to be eligible for loans
    const MAX_AGE = 65; // Maximum age to be eligible for loans

    // Customer Status Enum
    const STATUSES = ['active', 'blocked', 'left'];
    const DEFAULT_STATUS = 'active';
    
    // Ownership Types Enum
    const OWNERSHIP_TYPES = [
        'Sole Proprietorship',
        'Partnership',
        'Private Limited',
        'Public Limited',
        'NGO',
        'Other'
    ];

    const PROVINCE_DISTRICTS = [
        'Western' => ['Colombo', 'Gampaha', 'Kalutara'],
        'Central' => ['Kandy', 'Matale', 'Nuwara Eliya'],
        'Southern' => ['Galle', 'Matara', 'Hambantota'],
        'Northern' => ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'],
        'Eastern' => ['Batticaloa', 'Ampara', 'Trincomalee'],
        'North Western' => ['Kurunegala', 'Puttalam'],
        'North Central' => ['Anuradhapura', 'Polonnaruwa'],
        'Uva' => ['Badulla', 'Monaragala'],
        'Sabaragamuwa' => ['Ratnapura', 'Kegalle']
    ];

    // Helper to get all provinces
    public static function getProvinces() {
        return array_keys(self::PROVINCE_DISTRICTS);
    }

    // Helper to get all districts
    public static function getDistricts() {
        return array_merge(...array_values(self::PROVINCE_DISTRICTS));
    }
    
    // Legacy constants for backward compatibility (if needed)
    const PROVINCES = [
        'Western', 'Central', 'Southern', 'Northern', 'Eastern',
        'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
    ];
    
    const DISTRICTS = [
        'Colombo', 'Gampaha', 'Kalutara',
        'Kandy', 'Matale', 'Nuwara Eliya',
        'Galle', 'Matara', 'Hambantota',
        'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu',
        'Batticaloa', 'Ampara', 'Trincomalee',
        'Kurunegala', 'Puttalam',
        'Anuradhapura', 'Polonnaruwa',
        'Badulla', 'Monaragala',
        'Ratnapura', 'Kegalle',
    ];
    
    const CITIES = [
        'Colombo',
        'Dehiwala-Mount Lavinia',
        'Moratuwa',
        'Negombo',
        'Gampaha',
        'Kalutara',
        'Kandy',
        'Matale',
        'Nuwara Eliya',
        'Galle',
        'Matara',
        'Hambantota',
        'Jaffna',
        'Kilinochchi',
        'Mannar',
        'Vavuniya',
        'Batticaloa',
        'Ampara',
        'Trincomalee',
        'Kurunegala',
        'Puttalam',
        'Anuradhapura',
        'Polonnaruwa',
        'Badulla',
        'Monaragala',
        'Ratnapura',
        'Kegalle',
    ];

    protected $fillable = [
        // Product / Location Details
        'branch_id',
        'center_id',
        'grp_id',
        'location',
        'product_type',
        'base_product',
        'pcsu_csu_code',
        
        // Customer Personal Details
        'code_type',
        'customer_code',
        'gender',
        'title',
        'full_name',
        'initials',
        'first_name',
        'last_name',
        'date_of_birth',
        'civil_status',
        'religion',
        'mobile_no_1',
        'mobile_no_2',
        'ccl_mobile_no',
        'spouse_name',
        'health_info',
        'family_members_count',
        'customer_profile_image',
        'monthly_income',
        
        // Customer Address Details
        'address_type',
        'address_line_1',
        'address_line_2',
        'address_line_3',
        'country',
        'province',
        'district',
        'city',
        'gs_division',
        'telephone',
        'preferred_address',
        
        // Business Details
        'ownership_type',
        'register_number',
        'business_name',
        'business_email',
        'business_duration',
        'business_place',
        'handled_by',
        'no_of_employees',
        'market_reputation',
        'sector',
        'sub_sector',
        'status', // Customer status (active, blocked, left)
    ];

    protected $casts = [
        'branch_id' => 'integer',
        'center_id' => 'integer',
        'grp_id' => 'integer',
        'health_info' => 'array',
        'date_of_birth' => 'date',
        'monthly_income' => 'decimal:2',
        'preferred_address' => 'boolean',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function center()
    {
        return $this->belongsTo(Center::class, 'center_id');
    }

    public function group()
    {
        return $this->belongsTo(Group::class, 'grp_id');
    }

    public function loans()
    {
        return $this->hasMany(Loan::class, 'customer_id');
    }
}

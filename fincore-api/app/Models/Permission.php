<?php

namespace App\Models;

use Spatie\Permission\Models\Permission as SpatiePermission;
use Illuminate\Database\Eloquent\SoftDeletes;

class Permission extends SpatiePermission
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'guard_name',
        'permission_group_id',
        'display_name',
        'description',
        'module',
        'is_core',
        'order',
        'metadata',
    ];

    protected $casts = [
        'is_core' => 'boolean',
        'order' => 'integer',
        'metadata' => 'array',
    ];

    protected $appends = [
        'group_name',
        'display_name_formatted',
    ];

    // Relationships
    public function group()
    {
        return $this->belongsTo(PermissionGroup::class, 'permission_group_id');
    }

    // Attributes
    public function getGroupNameAttribute()
    {
        return $this->group ? $this->group->name : null;
    }

    public function getDisplayNameFormattedAttribute()
    {
        return $this->display_name ?: ucwords(str_replace(['.', '-', '_'], ' ', $this->name));
    }

    // Scopes
    public function scopeByGroup($query, $groupId)
    {
        return $query->where('permission_group_id', $groupId);
    }

    public function scopeByModule($query, $module)
    {
        return $query->where('module', $module);
    }

    public function scopeCore($query)
    {
        return $query->where('is_core', true);
    }

    public function scopeCustom($query)
    {
        return $query->where('is_core', false);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order')->orderBy('display_name');
    }
}
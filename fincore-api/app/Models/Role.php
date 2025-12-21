<?php

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends SpatieRole
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'guard_name',
        'display_name',
        'description',
        'level',
        'hierarchy',
        'is_system',
        'is_default',
        'is_editable',
        'restrictions',
    ];

    protected $casts = [
        'hierarchy' => 'integer',
        'is_system' => 'boolean',
        'is_default' => 'boolean',
        'is_editable' => 'boolean',
        'restrictions' => 'array',
    ];

    protected $appends = [
        'permissions_count',
        'users_count',
        'display_name_formatted',
        'level_formatted',
    ];

    // Don't override any parent methods
    
    // Attributes
    public function getDisplayNameFormattedAttribute()
    {
        return $this->display_name ?: ucwords(str_replace('_', ' ', $this->name));
    }

    public function getLevelFormattedAttribute()
    {
        return ucwords(str_replace('_', ' ', $this->level));
    }

    public function getPermissionsCountAttribute()
    {
        return $this->permissions()->count();
    }

    public function getUsersCountAttribute()
    {
        return $this->users()->count();
    }

    // Scopes
    public function scopeByLevel($query, $level)
    {
        return $query->where('level', $level);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeEditable($query)
    {
        return $query->where('is_editable', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('hierarchy')->orderBy('display_name');
    }

    // Methods - Use different names to avoid conflicts
    public function canBeDeleted()
    {
        return !$this->is_system && $this->users()->count() === 0;
    }

    public function canBeEdited()
    {
        return $this->is_editable && !$this->is_system;
    }
}
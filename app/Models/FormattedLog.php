<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FormattedLog extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'raw_log',
        'formatted_log',
        'summary',
        'detected_log_type',
        'field_count',
        'is_saved',
    ];

    protected $casts = [
        'formatted_log' => 'array',
        'is_saved' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}

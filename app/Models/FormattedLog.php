<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormattedLog extends Model
{
    protected $fillable = [
        'raw_log',
        'formatted_log',
    ];

    protected $casts = [
        'formatted_log' => 'array',
    ];
}

<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'preferences' => 'array',
        ];
    }

    public function formattedLogs(): HasMany
    {
        return $this->hasMany(FormattedLog::class);
    }

    public function getPreferencesAttribute($value): array
    {
        $defaults = [
            'outputFormat' => 'json',
            'jsonIndentation' => 2,
            'autoCopyResults' => false,
            'showLineNumbers' => true,
            'saveToHistory' => true,
            'anonymousAnalytics' => true,
            'avoidSensitiveStorage' => false,
            'fontSize' => 'medium',
            'reduceAnimations' => false,
            'customApiEndpoint' => '',
            'apiKey' => '',
            'timeoutSeconds' => 30,
        ];

        if (is_null($value) || $value === '') {
            return $defaults;
        }

        $preferences = is_string($value) ? json_decode($value, true) : $value;

        return array_merge($defaults, $preferences ?? []);
    }

    public function setPreferencesAttribute($value): void
    {
        if ($value === '' || $value === null) {
            $this->attributes['preferences'] = null;

            return;
        }

        $this->attributes['preferences'] = is_array($value)
            ? json_encode($value)
            : $value;
    }
}

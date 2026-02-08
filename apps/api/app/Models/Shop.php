<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ShopFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shop extends Model
{
    /** @use HasFactory<ShopFactory> */
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'name',
        'address',
        'city',
        'zip_code',
        'phone',
        'latitude',
        'longitude',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    /** @param Builder<Shop> $query */
    public function scopeForUser(Builder $query, User $user): void
    {
        if (! $user->hasRole('admin')) {
            $query->where('partner_id', $user->partner_id);
        }
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}

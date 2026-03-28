<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\DemandeFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Demande extends Model
{
    /** @use HasFactory<DemandeFactory> */
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'commercial_id',
        'sdr_id',
        'ref_demande',
        'ref_client',
        'information',
        'is_exoneration',
        'pays_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_exoneration' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $demande): void {
            if (empty($demande->ref_demande)) {
                $demande->ref_demande = static::generateRefDemande();
            }
        });
    }

    public static function generateRefDemande(): string
    {
        $date = now()->format('ymd');
        $maxAttempts = 10;

        for ($i = 0; $i < $maxAttempts; $i++) {
            $suffix = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 4));
            $ref = "DEM-{$date}-{$suffix}";

            if (! static::where('ref_demande', $ref)->exists()) {
                return $ref;
            }
        }

        // Fallback with microsecond uniqueness
        return 'DEM-'.$date.'-'.strtoupper(substr(md5(uniqid('', true)), 0, 4));
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return BelongsTo<User, $this> */
    public function commercial(): BelongsTo
    {
        return $this->belongsTo(User::class, 'commercial_id');
    }

    /** @return BelongsTo<User, $this> */
    public function sdr(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sdr_id');
    }

    /** @return HasMany<Operation, $this> */
    public function operations(): HasMany
    {
        return $this->hasMany(Operation::class);
    }

    /** @param Builder<Demande> $query */
    public function scopeForUser(Builder $query, User $user): void
    {
        // Internal users (no partner_id) with 'view demandes' permission see all demandes
        if ($user->partner_id === null && $user->can('view demandes')) {
            return;
        }

        $query->where('partner_id', $user->partner_id);
    }

    /** @param Builder<Demande> $query */
    public function scopeWithOperationCounts(Builder $query): void
    {
        $query->withCount([
            'operations',
            'operations as operations_completed_count' => fn ($q) => $q->where('lifecycle_status', 'completed'),
            'operations as operations_blocked_count' => fn ($q) => $q->where('lifecycle_status', 'on_hold'),
        ]);
    }
}

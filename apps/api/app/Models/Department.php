<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\DepartmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use MatanYadaev\EloquentSpatial\Objects\MultiPolygon;
use MatanYadaev\EloquentSpatial\Traits\HasSpatial;

class Department extends Model
{
    /** @use HasFactory<DepartmentFactory> */
    use HasFactory, HasSpatial;

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    /** @var list<string> */
    protected $fillable = [
        'code',
        'name',
        'region_code',
        'geometry',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'geometry' => MultiPolygon::class,
        ];
    }

    /** @return BelongsTo<Region, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_code', 'code');
    }

    /** @return HasMany<IrisZone, $this> */
    public function irisZones(): HasMany
    {
        return $this->hasMany(IrisZone::class, 'department_code', 'code');
    }
}

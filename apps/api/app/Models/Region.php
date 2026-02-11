<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\RegionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use MatanYadaev\EloquentSpatial\Objects\MultiPolygon;
use MatanYadaev\EloquentSpatial\Traits\HasSpatial;

class Region extends Model
{
    /** @use HasFactory<RegionFactory> */
    use HasFactory, HasSpatial;

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    /** @var list<string> */
    protected $fillable = [
        'code',
        'name',
        'geometry',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'geometry' => MultiPolygon::class,
        ];
    }

    /** @return HasMany<Department, $this> */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'region_code', 'code');
    }
}

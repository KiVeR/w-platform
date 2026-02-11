<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\IrisType;
use Database\Factories\IrisZoneFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MatanYadaev\EloquentSpatial\Objects\MultiPolygon;
use MatanYadaev\EloquentSpatial\Traits\HasSpatial;

class IrisZone extends Model
{
    /** @use HasFactory<IrisZoneFactory> */
    use HasFactory, HasSpatial;

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    /** @var list<string> */
    protected $fillable = [
        'code',
        'name',
        'department_code',
        'commune_code',
        'commune_name',
        'iris_type',
        'geometry',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'iris_type' => IrisType::class,
            'geometry' => MultiPolygon::class,
        ];
    }

    /** @return BelongsTo<Department, $this> */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_code', 'code');
    }
}

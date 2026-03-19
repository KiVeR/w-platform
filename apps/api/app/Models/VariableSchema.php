<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\VariableSchemaFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * @property string $uuid
 * @property int $partner_id
 * @property string $name
 * @property array<string, mixed>|null $global_data
 * @property array<string, mixed>|null $recipient_preview_data
 * @property-read Collection<int, VariableField> $global_variables
 * @property-read Collection<int, VariableField> $recipient_variables
 * @property-read Collection<int, VariableField> $used_variables
 * @property-read Collection<int, VariableField> $unused_variables
 * @property-read list<array{key: string, data: array<string, mixed>}> $global_data_sets
 * @property-read list<array{key: string, data: array<string, mixed>}> $recipient_preview_data_sets
 * @property-read array<string, mixed> $merged_preview_data
 */
class VariableSchema extends Model
{
    /** @use HasFactory<VariableSchemaFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'uuid',
        'partner_id',
        'name',
        'global_data',
        'recipient_preview_data',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'global_data' => 'array',
            'recipient_preview_data' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (VariableSchema $schema): void {
            if (empty($schema->uuid)) {
                $schema->uuid = (string) Str::uuid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /** @param Builder<VariableSchema> $query */
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

    /** @return HasMany<VariableField, $this> */
    public function variableFields(): HasMany
    {
        return $this->hasMany(VariableField::class);
    }

    /** @return HasMany<Campaign, $this> */
    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    /** @return HasMany<LandingPage, $this> */
    public function landingPages(): HasMany
    {
        return $this->hasMany(LandingPage::class);
    }

    /** @return Attribute<Collection<int, VariableField>, never> */
    protected function globalVariables(): Attribute
    {
        return Attribute::make(
            get: fn (): Collection => $this->variableFields->where('is_global', true)->values(),
        );
    }

    /** @return Attribute<Collection<int, VariableField>, never> */
    protected function recipientVariables(): Attribute
    {
        return Attribute::make(
            get: fn (): Collection => $this->variableFields->where('is_global', false)->values(),
        );
    }

    /** @return Attribute<Collection<int, VariableField>, never> */
    protected function usedVariables(): Attribute
    {
        return Attribute::make(
            get: fn (): Collection => $this->variableFields->where('is_used', true)->values(),
        );
    }

    /** @return Attribute<Collection<int, VariableField>, never> */
    protected function unusedVariables(): Attribute
    {
        return Attribute::make(
            get: fn (): Collection => $this->variableFields->where('is_used', false)->values(),
        );
    }

    /**
     * @return Attribute<list<array{key: string, data: array<string, mixed>}>, never>
     */
    protected function globalDataSets(): Attribute
    {
        return Attribute::make(
            get: fn (): array => $this->normalizeDataSets($this->global_data, defaultKey: 'default'),
        );
    }

    /**
     * @return Attribute<list<array{key: string, data: array<string, mixed>}>, never>
     */
    protected function recipientPreviewDataSets(): Attribute
    {
        return Attribute::make(
            get: fn (): array => $this->normalizeDataSets($this->recipient_preview_data, defaultKey: 'default'),
        );
    }

    /**
     * @return Attribute<array<string, mixed>, never>
     */
    protected function mergedPreviewData(): Attribute
    {
        return Attribute::make(
            get: function (): array {
                $recipientPreviewDataSets = $this->recipient_preview_data_sets;
                $firstDataSet = $recipientPreviewDataSets[0]['data'] ?? [];
                $globalKey = $firstDataSet['global_parameters_key'] ?? null;
                unset($firstDataSet['global_parameters_key']);

                if (! is_string($globalKey) || $globalKey === '') {
                    return $firstDataSet;
                }

                return array_merge($this->getGlobalDataByKey($globalKey), $firstDataSet);
            },
        );
    }

    /**
     * Resolve a global data dataset by key.
     *
     * Supports both the legacy keyed map format and the list format used by
     * the current API payloads.
     *
     * @return array<string, mixed>
     */
    public function getGlobalDataByKey(string $key): array
    {
        $globalData = $this->global_data ?? [];

        if (isset($globalData[$key]) && is_array($globalData[$key])) {
            return $this->normalizeDataPayload($globalData[$key]);
        }

        foreach ($globalData as $item) {
            if (! is_array($item)) {
                continue;
            }

            $itemKey = $item['key'] ?? null;
            $itemData = $item['data'] ?? null;

            if ($itemKey !== $key || ! is_array($itemData)) {
                continue;
            }

            return $this->normalizeDataPayload($itemData);
        }

        return [];
    }

    /**
     * @param  list<string>|null  $variableNames
     */
    public function syncUsage(?array $variableNames, bool $isUsed): void
    {
        $query = $this->variableFields();

        if ($variableNames !== null) {
            $variableNames = array_values(array_unique(array_filter(
                $variableNames,
                static fn (string $name): bool => $name !== '',
            )));

            if ($variableNames === []) {
                return;
            }

            $query->whereIn('name', $variableNames);
        }

        $query->update(['is_used' => $isUsed]);
    }

    /**
     * @param  array<string, mixed>|null  $source
     * @return list<array{key: string, data: array<string, mixed>}>
     */
    private function normalizeDataSets(?array $source, string $defaultKey): array
    {
        if ($source === null || $source === []) {
            return [];
        }

        if ($this->isListDataSetFormat($source)) {
            $normalized = [];

            foreach ($source as $item) {
                if (! is_array($item)) {
                    continue;
                }

                $itemKey = $item['key'] ?? null;
                $itemData = $item['data'] ?? [];

                if (! is_string($itemKey)) {
                    continue;
                }

                $normalized[] = [
                    'key' => $itemKey,
                    'data' => is_array($itemData) ? $this->normalizeDataPayload($itemData) : [],
                ];
            }

            return $normalized;
        }

        $normalized = [];

        foreach ($source as $key => $data) {
            if (! is_array($data)) {
                return [[
                    'key' => $defaultKey,
                    'data' => $this->normalizeDataPayload($source),
                ]];
            }

            $normalized[] = [
                'key' => $key,
                'data' => $this->normalizeDataPayload($data),
            ];
        }

        return $normalized;
    }

    /**
     * @param  array<int|string, mixed>  $source
     */
    private function isListDataSetFormat(array $source): bool
    {
        if (! array_is_list($source)) {
            return false;
        }

        foreach ($source as $item) {
            if (! is_array($item) || ! array_key_exists('key', $item)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeDataPayload(array $data): array
    {
        $normalized = [];

        foreach ($data as $key => $value) {
            $normalized[(string) $key] = $value;
        }

        return $normalized;
    }
}

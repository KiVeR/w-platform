<?php

declare(strict_types=1);

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

/** @implements Filter<\Illuminate\Database\Eloquent\Model> */
class DateRangeFilter implements Filter
{
    public function __construct(
        private readonly string $column,
        private readonly string $operator,
    ) {}

    /** @param Builder<\Illuminate\Database\Eloquent\Model> $query */
    public function __invoke(Builder $query, mixed $value, string $property): void
    {
        if (! is_string($value) || $value === '') {
            return;
        }

        $query->whereDate($this->column, $this->operator, $value);
    }

    public static function from(string $column): self
    {
        return new self($column, '>=');
    }

    public static function to(string $column): self
    {
        return new self($column, '<=');
    }
}

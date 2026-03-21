<?php

declare(strict_types=1);

namespace App\DTOs;

final readonly class ChecklistItem
{
    /**
     * @param 'pass'|'fail'|'na' $status
     */
    public function __construct(
        public string $name,
        public string $status,
        public string $message,
    ) {}

    public function passes(): bool
    {
        return $this->status === 'pass';
    }

    public function isNotApplicable(): bool
    {
        return $this->status === 'na';
    }

    public function isBlocking(): bool
    {
        return $this->status === 'fail';
    }

    /** @return array{name: string, status: string, message: string} */
    public function toArray(): array
    {
        return [
            'name'    => $this->name,
            'status'  => $this->status,
            'message' => $this->message,
        ];
    }
}

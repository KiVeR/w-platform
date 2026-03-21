<?php

declare(strict_types=1);

namespace App\Enums;

enum OperationType: string
{
    case LOC = 'loc';
    case FID = 'fid';
    case RLOC = 'rloc';
    case ACQ = 'acq';
    case QUAL = 'qual';
    case REP = 'rep';
    case ENRICH = 'enrich';
    case VALID = 'valid';
    case FILTRE = 'filtre';

    public function label(): string
    {
        return match($this) {
            self::LOC    => 'Localisation',
            self::FID    => 'Fidélisation',
            self::RLOC   => 'Relocalisation',
            self::ACQ    => 'Acquisition',
            self::QUAL   => 'Qualification',
            self::REP    => 'Répétition',
            self::ENRICH => 'Enrichissement',
            self::VALID  => 'Validation',
            self::FILTRE => 'Filtrage',
        };
    }

    public function requiresRouting(): bool
    {
        return match($this) {
            self::LOC, self::RLOC, self::ACQ, self::REP => true,
            default => false,
        };
    }

    public function requiresCreative(): bool
    {
        return match($this) {
            self::LOC, self::FID, self::RLOC, self::ACQ, self::REP => true,
            default => false,
        };
    }

    public function requiresScheduling(): bool
    {
        return match($this) {
            self::LOC, self::FID, self::RLOC, self::ACQ, self::REP => true,
            default => false,
        };
    }

    public function requiresCounting(): bool
    {
        return match($this) {
            self::LOC, self::RLOC, self::ACQ, self::QUAL, self::REP => true,
            default => false,
        };
    }

    public function requiresBilling(): bool
    {
        return match($this) {
            self::ENRICH, self::VALID, self::FILTRE => false,
            default => true,
        };
    }

    public function allowsParent(): bool
    {
        return match($this) {
            self::REP, self::RLOC => true,
            default => false,
        };
    }

    public function requiresParent(): bool
    {
        return $this === self::REP;
    }

    public function isDataOp(): bool
    {
        return match($this) {
            self::ENRICH, self::VALID, self::FILTRE => true,
            default => false,
        };
    }
}

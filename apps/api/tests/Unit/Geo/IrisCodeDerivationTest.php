<?php

declare(strict_types=1);

use App\Console\Commands\SeedGeoDataCommand;

it('derives standard department code', function (): void {
    $command = new SeedGeoDataCommand;

    expect($command->deriveDepartmentCode('751010101'))->toBe('75')
        ->and($command->deriveDepartmentCode('330560201'))->toBe('33')
        ->and($command->deriveDepartmentCode('010010101'))->toBe('01');
});

it('derives Corse 2A department code', function (): void {
    $command = new SeedGeoDataCommand;

    expect($command->deriveDepartmentCode('2A0040101'))->toBe('2A');
});

it('derives Corse 2B department code', function (): void {
    $command = new SeedGeoDataCommand;

    expect($command->deriveDepartmentCode('2B0330101'))->toBe('2B');
});

it('derives DOM-TOM 97x department code', function (): void {
    $command = new SeedGeoDataCommand;

    expect($command->deriveDepartmentCode('971010101'))->toBe('971')
        ->and($command->deriveDepartmentCode('972020101'))->toBe('972')
        ->and($command->deriveDepartmentCode('974010101'))->toBe('974');
});

it('handles edge case department codes', function (): void {
    $command = new SeedGeoDataCommand;

    expect($command->deriveDepartmentCode('950010101'))->toBe('95')
        ->and($command->deriveDepartmentCode('690560201'))->toBe('69');
});

it('derives 3-digit code for all DOM prefixes', function (): void {
    $command = new SeedGeoDataCommand;

    expect($command->deriveDepartmentCode('973010101'))->toBe('973')
        ->and($command->deriveDepartmentCode('976010101'))->toBe('976');
});

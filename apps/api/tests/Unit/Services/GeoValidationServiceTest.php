<?php

declare(strict_types=1);

use App\Services\Geo\GeoValidationService;
use App\Services\Geo\IrisData;

beforeEach(function () {
    $this->service = new GeoValidationService;
});

describe('isValidPostcode()', function () {
    it('returns true for valid French postcodes', function () {
        expect($this->service->isValidPostcode('75001'))->toBeTrue();
        expect($this->service->isValidPostcode('13000'))->toBeTrue();
        expect($this->service->isValidPostcode('01000'))->toBeTrue();
        expect($this->service->isValidPostcode('97400'))->toBeTrue();
    });

    it('returns true for Corsica postcodes', function () {
        expect($this->service->isValidPostcode('2A000'))->toBeTrue();
        expect($this->service->isValidPostcode('2B000'))->toBeTrue();
    });

    it('returns false for invalid postcodes', function () {
        expect($this->service->isValidPostcode('99999'))->toBeFalse();
        expect($this->service->isValidPostcode('00000'))->toBeFalse();
        expect($this->service->isValidPostcode('1234'))->toBeFalse();
        expect($this->service->isValidPostcode('123456'))->toBeFalse();
        expect($this->service->isValidPostcode('abcde'))->toBeFalse();
    });

    it('is case insensitive for Corsica codes', function () {
        expect($this->service->isValidPostcode('2a000'))->toBeTrue();
        expect($this->service->isValidPostcode('2b000'))->toBeTrue();
    });
});

describe('isValidDepartment()', function () {
    it('returns true for valid department codes', function () {
        expect($this->service->isValidDepartment('75'))->toBeTrue();
        expect($this->service->isValidDepartment('01'))->toBeTrue();
        expect($this->service->isValidDepartment('95'))->toBeTrue();
        expect($this->service->isValidDepartment('971'))->toBeTrue();
        expect($this->service->isValidDepartment('976'))->toBeTrue();
    });

    it('returns true for Corsica department codes', function () {
        expect($this->service->isValidDepartment('2A'))->toBeTrue();
        expect($this->service->isValidDepartment('2B'))->toBeTrue();
    });

    it('returns false for invalid department codes', function () {
        // '00' is invalid (not 01-09 range)
        expect($this->service->isValidDepartment('00'))->toBeFalse();
        expect($this->service->isValidDepartment('abc'))->toBeFalse();
        // '978' is invalid (only 971-976 DOM-TOM)
        expect($this->service->isValidDepartment('978'))->toBeFalse();
    });

    it('is case insensitive for Corsica', function () {
        expect($this->service->isValidDepartment('2a'))->toBeTrue();
        expect($this->service->isValidDepartment('2b'))->toBeTrue();
    });
});

describe('getDepartment()', function () {
    it('extracts department from standard postcode', function () {
        expect($this->service->getDepartment('75001'))->toBe('75');
        expect($this->service->getDepartment('13000'))->toBe('13');
        expect($this->service->getDepartment('01000'))->toBe('01');
    });

    it('extracts DOM-TOM department (3 digits)', function () {
        expect($this->service->getDepartment('97400'))->toBe('974');
        expect($this->service->getDepartment('97100'))->toBe('971');
    });

    it('extracts Corsica department', function () {
        expect($this->service->getDepartment('2A000'))->toBe('2A');
        expect($this->service->getDepartment('2B000'))->toBe('2B');
    });
});

describe('isValidIris()', function () {
    it('returns true for a valid 9-digit IRIS code', function () {
        expect($this->service->isValidIris('751010101'))->toBeTrue();
        expect($this->service->isValidIris('693810101'))->toBeTrue();
        expect($this->service->isValidIris('000000000'))->toBeTrue();
    });

    it('returns false for invalid IRIS codes', function () {
        expect($this->service->isValidIris('12345678'))->toBeFalse(); // 8 digits
        expect($this->service->isValidIris('1234567890'))->toBeFalse(); // 10 digits
        expect($this->service->isValidIris('12345678a'))->toBeFalse(); // non-numeric
        expect($this->service->isValidIris(''))->toBeFalse();
    });
});

describe('parseIris()', function () {
    it('parses a valid IRIS code into components', function () {
        $result = $this->service->parseIris('751010101');

        expect($result)->toBeInstanceOf(IrisData::class)
            ->and($result->iris)->toBe('751010101')
            ->and($result->cityCode)->toBe('75101')
            ->and($result->irisCode)->toBe('0101');
    });

    it('pads short IRIS code with leading zeros', function () {
        $result = $this->service->parseIris('123456');

        expect($result->iris)->toBe('000123456');
    });
});

describe('isParisLyonMarseille()', function () {
    it('returns true for Paris arrondissement postcodes', function () {
        expect($this->service->isParisLyonMarseille('75001'))->toBeTrue();
        expect($this->service->isParisLyonMarseille('75010'))->toBeTrue();
        expect($this->service->isParisLyonMarseille('75020'))->toBeTrue();
    });

    it('returns true for Lyon arrondissement postcodes', function () {
        expect($this->service->isParisLyonMarseille('69001'))->toBeTrue();
        expect($this->service->isParisLyonMarseille('69009'))->toBeTrue();
    });

    it('returns true for Marseille arrondissement postcodes', function () {
        expect($this->service->isParisLyonMarseille('13001'))->toBeTrue();
        expect($this->service->isParisLyonMarseille('13016'))->toBeTrue();
    });

    it('returns false for other postcodes', function () {
        expect($this->service->isParisLyonMarseille('31000'))->toBeFalse();
        expect($this->service->isParisLyonMarseille('75021'))->toBeFalse(); // out of range
        expect($this->service->isParisLyonMarseille('13017'))->toBeFalse(); // out of range
    });
});

describe('isMetropolitanFrance()', function () {
    it('returns true for metropolitan France postcodes', function () {
        expect($this->service->isMetropolitanFrance('75001'))->toBeTrue();
        expect($this->service->isMetropolitanFrance('13000'))->toBeTrue();
        expect($this->service->isMetropolitanFrance('2A000'))->toBeTrue();
    });

    it('returns false for DOM-TOM postcodes', function () {
        expect($this->service->isMetropolitanFrance('97400'))->toBeFalse();
        expect($this->service->isMetropolitanFrance('97100'))->toBeFalse();
    });
});

describe('isCorsica()', function () {
    it('returns true for Corsica postcodes', function () {
        expect($this->service->isCorsica('2A000'))->toBeTrue();
        expect($this->service->isCorsica('2B000'))->toBeTrue();
        expect($this->service->isCorsica('20000'))->toBeTrue();
    });

    it('returns false for non-Corsica postcodes', function () {
        expect($this->service->isCorsica('75001'))->toBeFalse();
        expect($this->service->isCorsica('97400'))->toBeFalse();
    });
});

describe('isDomTom()', function () {
    it('returns true for DOM-TOM postcodes', function () {
        expect($this->service->isDomTom('97400'))->toBeTrue();
        expect($this->service->isDomTom('97100'))->toBeTrue();
    });

    it('returns false for metropolitan France', function () {
        expect($this->service->isDomTom('75001'))->toBeFalse();
        expect($this->service->isDomTom('2A000'))->toBeFalse();
    });
});

describe('formatPostcode()', function () {
    it('pads standard postcodes with leading zeros', function () {
        expect($this->service->formatPostcode('1000'))->toBe('01000');
        expect($this->service->formatPostcode('75001'))->toBe('75001');
    });

    it('handles Corsica postcodes', function () {
        expect($this->service->formatPostcode('2A'))->toBe('2A000');
        expect($this->service->formatPostcode('2B'))->toBe('2B000');
    });

    it('strips non-numeric chars before padding for standard codes', function () {
        expect($this->service->formatPostcode(' 75001 '))->toBe('75001');
    });
});

describe('getRegionFromDepartment()', function () {
    it('returns Île-de-France for Paris (75)', function () {
        expect($this->service->getRegionFromDepartment('75'))->toBe('Île-de-France');
    });

    it('returns correct region for Corsica departments', function () {
        expect($this->service->getRegionFromDepartment('2A'))->toBe('Corse');
        expect($this->service->getRegionFromDepartment('2B'))->toBe('Corse');
    });

    it('returns correct region for DOM-TOM', function () {
        expect($this->service->getRegionFromDepartment('971'))->toBe('Guadeloupe');
        expect($this->service->getRegionFromDepartment('974'))->toBe('La Réunion');
    });

    it('returns null for unknown department', function () {
        expect($this->service->getRegionFromDepartment('99'))->toBeNull();
    });
});

describe('IrisData', function () {
    it('creates IrisData from string', function () {
        $iris = IrisData::fromString('751010101');

        expect($iris->iris)->toBe('751010101')
            ->and($iris->cityCode)->toBe('75101')
            ->and($iris->irisCode)->toBe('0101')
            ->and($iris->type)->toBeNull();
    });

    it('gets department from standard IRIS', function () {
        $iris = IrisData::fromString('751010101');
        expect($iris->getDepartment())->toBe('75');
    });

    it('gets department from DOM-TOM IRIS', function () {
        $iris = IrisData::fromString('974010101');
        expect($iris->getDepartment())->toBe('974');
    });

    it('detects PLM city (Paris)', function () {
        $iris = IrisData::fromString('751010101');
        expect($iris->isInPlmCity())->toBeTrue();
    });

    it('detects PLM city (Lyon)', function () {
        $iris = IrisData::fromString('693810101');
        expect($iris->isInPlmCity())->toBeTrue();
    });

    it('detects PLM city (Marseille)', function () {
        $iris = IrisData::fromString('132010101');
        expect($iris->isInPlmCity())->toBeTrue();
    });

    it('returns false for non-PLM city', function () {
        $iris = IrisData::fromString('310010101');
        expect($iris->isInPlmCity())->toBeFalse();
    });

    it('converts to array', function () {
        $iris = IrisData::fromString('751010101');
        $array = $iris->toArray();

        expect($array)->toHaveKeys(['iris', 'city_code', 'iris_code', 'type', 'department'])
            ->and($array['iris'])->toBe('751010101')
            ->and($array['department'])->toBe('75');
    });
});

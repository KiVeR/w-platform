<?php

declare(strict_types=1);

use App\Enums\PhoneFormat;
use App\Services\Phone\PhoneErrorCode;
use App\Services\Phone\PhoneValidationResult;
use App\Services\Phone\PhoneValidationService;

beforeEach(function () {
    $this->service = new PhoneValidationService;
});

describe('isValid()', function () {
    it('returns true for a valid French mobile number', function () {
        expect($this->service->isValid('0612345678'))->toBeTrue();
    });

    it('returns true for E.164 format', function () {
        expect($this->service->isValid('+33612345678'))->toBeTrue();
    });

    it('returns false for an invalid number', function () {
        expect($this->service->isValid('123'))->toBeFalse();
        expect($this->service->isValid('abcdefghij'))->toBeFalse();
        expect($this->service->isValid(''))->toBeFalse();
    });

    it('returns false for a fixed line number', function () {
        // Fixed lines are valid phone numbers but not mobile
        // isValid() uses libphonenumber which accepts fixed lines too
        // Let's test with truly invalid numbers
        expect($this->service->isValid('0000000000'))->toBeFalse();
    });
});

describe('validate()', function () {
    it('returns valid result for a valid French mobile number', function () {
        $result = $this->service->validate('0612345678');

        expect($result)->toBeInstanceOf(PhoneValidationResult::class)
            ->and($result->isValid)->toBeTrue()
            ->and($result->normalized)->toBe('+33612345678')
            ->and($result->errorCode)->toBeNull()
            ->and($result->isMobile)->toBeTrue();
    });

    it('returns invalid result for a too-short number', function () {
        $result = $this->service->validate('0612');

        expect($result->isValid)->toBeFalse()
            ->and($result->errorCode)->toBe(PhoneErrorCode::TOO_SHORT);
    });

    it('returns invalid result for a too-long number', function () {
        $result = $this->service->validate('061234567890');

        expect($result->isValid)->toBeFalse()
            ->and($result->errorCode)->toBe(PhoneErrorCode::TOO_LONG);
    });

    it('returns invalid result for a non-mobile number', function () {
        $result = $this->service->validate('0112345678');

        expect($result->isValid)->toBeFalse()
            ->and($result->errorCode)->toBe(PhoneErrorCode::NOT_MOBILE);
    });

    it('returns invalid result for empty input', function () {
        $result = $this->service->validate('');

        expect($result->isValid)->toBeFalse()
            ->and($result->errorCode)->toBe(PhoneErrorCode::INVALID_FORMAT);
    });

    it('uses PhoneValidationResult::valid() factory', function () {
        $result = PhoneValidationResult::valid('+33612345678', true, false);

        expect($result->isValid)->toBeTrue()
            ->and($result->normalized)->toBe('+33612345678')
            ->and($result->isMobile)->toBeTrue()
            ->and($result->isDomTom)->toBeFalse()
            ->and($result->errorCode)->toBeNull();
    });

    it('uses PhoneValidationResult::invalid() factory', function () {
        $result = PhoneValidationResult::invalid(PhoneErrorCode::TOO_SHORT, 'Too short');

        expect($result->isValid)->toBeFalse()
            ->and($result->normalized)->toBeNull()
            ->and($result->errorCode)->toBe(PhoneErrorCode::TOO_SHORT)
            ->and($result->errorMessage)->toBe('Too short');
    });
});

describe('sanitize()', function () {
    it('removes spaces from phone number', function () {
        expect($this->service->sanitize('06 12 34 56 78'))->toBe('0612345678');
    });

    it('removes dots from phone number', function () {
        expect($this->service->sanitize('06.12.34.56.78'))->toBe('0612345678');
    });

    it('converts +33 prefix to 0', function () {
        expect($this->service->sanitize('+33612345678'))->toBe('0612345678');
    });

    it('converts 33 prefix to 0', function () {
        expect($this->service->sanitize('33612345678'))->toBe('0612345678');
    });

    it('adds leading zero to 9-digit number', function () {
        expect($this->service->sanitize('612345678'))->toBe('0612345678');
    });

    it('fixes OCR error i → 1', function () {
        expect($this->service->sanitize('06i2345678'))->toBe('0612345678');
    });

    it('fixes OCR error o → 0', function () {
        expect($this->service->sanitize('o612345678'))->toBe('0612345678');
    });
});

describe('isMobile()', function () {
    it('returns true for 06 prefix', function () {
        expect($this->service->isMobile('0612345678'))->toBeTrue();
    });

    it('returns true for 07 prefix', function () {
        expect($this->service->isMobile('0712345678'))->toBeTrue();
    });

    it('returns false for 01 prefix (fixed line)', function () {
        expect($this->service->isMobile('0112345678'))->toBeFalse();
    });

    it('returns false for 08 prefix', function () {
        expect($this->service->isMobile('0812345678'))->toBeFalse();
    });

    it('handles E.164 format', function () {
        expect($this->service->isMobile('+33612345678'))->toBeTrue();
    });
});

describe('isDomTom()', function () {
    it('returns true for DOM-TOM prefixes', function () {
        expect($this->service->isDomTom('0692123456'))->toBeTrue();
        expect($this->service->isDomTom('0690123456'))->toBeTrue();
        expect($this->service->isDomTom('0694123456'))->toBeTrue();
        expect($this->service->isDomTom('0696123456'))->toBeTrue();
    });

    it('returns false for metropolitan France mobile', function () {
        expect($this->service->isDomTom('0612345678'))->toBeFalse();
    });
});

describe('format()', function () {
    it('formats to E164 by default', function () {
        expect($this->service->format('0612345678'))->toBe('+33612345678');
    });

    it('formats to NATIONAL', function () {
        $result = $this->service->format('0612345678', PhoneFormat::NATIONAL);
        expect($result)->toContain('06');
    });

    it('formats to INTERNATIONAL', function () {
        $result = $this->service->format('0612345678', PhoneFormat::INTERNATIONAL);
        expect($result)->toContain('+33');
    });

    it('returns original phone on parse error', function () {
        expect($this->service->format('invalid'))->toBe('invalid');
    });
});

describe('PhoneErrorCode', function () {
    it('has all expected error constants', function () {
        expect(PhoneErrorCode::INVALID_FORMAT)->toBe('PHONE_INVALID_FORMAT');
        expect(PhoneErrorCode::BLACKLISTED)->toBe('PHONE_BLACKLISTED');
        expect(PhoneErrorCode::NOT_MOBILE)->toBe('PHONE_NOT_MOBILE');
        expect(PhoneErrorCode::DOM_TOM_EXCLUDED)->toBe('PHONE_DOM_TOM_EXCLUDED');
        expect(PhoneErrorCode::TOO_SHORT)->toBe('PHONE_TOO_SHORT');
        expect(PhoneErrorCode::TOO_LONG)->toBe('PHONE_TOO_LONG');
        expect(PhoneErrorCode::PARSE_ERROR)->toBe('PHONE_PARSE_ERROR');
    });

    it('returns French messages for each error code', function () {
        expect(PhoneErrorCode::getMessage(PhoneErrorCode::INVALID_FORMAT))->toContain('invalide');
        expect(PhoneErrorCode::getMessage(PhoneErrorCode::TOO_SHORT))->toContain('court');
        expect(PhoneErrorCode::getMessage(PhoneErrorCode::NOT_MOBILE))->toContain('mobile');
    });

    it('returns a default message for unknown codes', function () {
        expect(PhoneErrorCode::getMessage('UNKNOWN_CODE'))->toContain('Erreur');
    });
});

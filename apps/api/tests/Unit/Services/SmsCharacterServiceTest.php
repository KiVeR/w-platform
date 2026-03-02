<?php

declare(strict_types=1);

use App\Enums\SmsEncoding;
use App\Services\Sms\SmsCharacterService;
use App\Services\Sms\SmsCountResult;

beforeEach(function () {
    $this->service = new SmsCharacterService;
});

describe('count()', function () {
    it('counts a simple GSM-7 message as 1 SMS', function () {
        $result = $this->service->count('Hello World');

        expect($result)->toBeInstanceOf(SmsCountResult::class)
            ->and($result->encoding)->toBe(SmsEncoding::GSM_7BIT)
            ->and($result->messages)->toBe(1)
            ->and($result->length)->toBe(11)
            ->and($result->perMessage)->toBe(160);
    });

    it('counts an empty message as 0 SMS', function () {
        $result = $this->service->count('');

        expect($result->messages)->toBe(0)
            ->and($result->length)->toBe(0);
    });

    it('detects multipart SMS when over 160 chars GSM-7', function () {
        $text = str_repeat('a', 161);
        $result = $this->service->count($text);

        expect($result->encoding)->toBe(SmsEncoding::GSM_7BIT)
            ->and($result->messages)->toBe(2)
            ->and($result->perMessage)->toBe(153);
    });

    it('counts emoji/UTF-16 message with 70 chars max per SMS', function () {
        $result = $this->service->count('Hello 😀');

        expect($result->encoding)->toBe(SmsEncoding::UTF16)
            ->and($result->perMessage)->toBe(70)
            ->and($result->messages)->toBe(1);
    });

    it('detects multipart UTF-16 SMS when over 70 chars', function () {
        $text = str_repeat('a', 69).'😀'; // emoji forces UTF-16, total > 70
        $result = $this->service->count($text);

        expect($result->encoding)->toBe(SmsEncoding::UTF16)
            ->and($result->messages)->toBeGreaterThan(1)
            ->and($result->perMessage)->toBe(67);
    });

    it('counts extended GSM characters (brackets, euro sign) correctly', function () {
        $result = $this->service->count('[test]');

        expect($result->encoding)->toBe(SmsEncoding::GSM_7BIT_EX)
            ->and($result->messages)->toBe(1);
        // Each extended char takes 2 positions
        expect($result->length)->toBe(8); // 6 chars + 2 escape sequences for [ and ]
    });

    it('returns correct remaining characters', function () {
        $result = $this->service->count('Hello');

        expect($result->remaining)->toBe(155); // 160 - 5
    });
});

describe('detectEncoding()', function () {
    it('detects GSM_7BIT for plain ASCII text', function () {
        expect($this->service->detectEncoding('Hello World'))->toBe(SmsEncoding::GSM_7BIT);
    });

    it('detects GSM_7BIT_EX for messages with brackets or euro sign', function () {
        expect($this->service->detectEncoding('Price: 10€'))->toBe(SmsEncoding::GSM_7BIT_EX);
        expect($this->service->detectEncoding('[test]'))->toBe(SmsEncoding::GSM_7BIT_EX);
    });

    it('detects UTF16 for messages with emojis', function () {
        expect($this->service->detectEncoding('Hello 😀'))->toBe(SmsEncoding::UTF16);
    });

    it('detects UTF16 for messages with Chinese characters', function () {
        expect($this->service->detectEncoding('你好'))->toBe(SmsEncoding::UTF16);
    });
});

describe('isGsmCompatible()', function () {
    it('returns true for GSM-7 text', function () {
        expect($this->service->isGsmCompatible('Hello World'))->toBeTrue();
    });

    it('returns true for extended GSM text', function () {
        expect($this->service->isGsmCompatible('[test]'))->toBeTrue();
    });

    it('returns false for emoji text', function () {
        expect($this->service->isGsmCompatible('Hello 😀'))->toBeFalse();
    });
});

describe('removeAccents()', function () {
    it('removes accents from French characters', function () {
        expect($this->service->removeAccents('éèêë'))->toBe('eeee');
        expect($this->service->removeAccents('àâä'))->toBe('aaa');
        expect($this->service->removeAccents('ùûü'))->toBe('uuu');
        expect($this->service->removeAccents('îï'))->toBe('ii');
        expect($this->service->removeAccents('ôö'))->toBe('oo');
    });

    it('converts ç to c', function () {
        expect($this->service->removeAccents('ç'))->toBe('c');
    });

    it('leaves ASCII text unchanged', function () {
        expect($this->service->removeAccents('Hello World'))->toBe('Hello World');
    });

    it('converts uppercase accented characters', function () {
        expect($this->service->removeAccents('ÀÁÂÃÄÅ'))->toBe('AAAAAA');
        expect($this->service->removeAccents('ÈÉÊË'))->toBe('EEEE');
    });
});

describe('sanitizeToGsm()', function () {
    it('removes accents and non-GSM characters', function () {
        $result = $this->service->sanitizeToGsm('Héllo Wörld');
        expect($result)->toBe('Hello World');
    });

    it('removes emoji characters', function () {
        $result = $this->service->sanitizeToGsm('Hello 😀 World');
        expect($result)->toBe('Hello  World');
    });

    it('keeps standard GSM characters', function () {
        $result = $this->service->sanitizeToGsm('Hello, World!');
        expect($result)->toBe('Hello, World!');
    });
});

describe('hasStopMention()', function () {
    it('returns true when message contains STOP mention', function () {
        expect($this->service->hasStopMention('Buy now STOP 36111'))->toBeTrue();
        expect($this->service->hasStopMention('text STOP 12345 more text'))->toBeTrue();
    });

    it('returns false when message does not contain STOP mention', function () {
        expect($this->service->hasStopMention('Hello World'))->toBeFalse();
        expect($this->service->hasStopMention('Please STOP'))->toBeFalse();
        expect($this->service->hasStopMention('STOP 123'))->toBeFalse(); // less than 5 digits
    });

    it('is case insensitive', function () {
        expect($this->service->hasStopMention('text stop 36111'))->toBeTrue();
        expect($this->service->hasStopMention('text Stop 36111'))->toBeTrue();
    });
});

describe('sanitizeStopMention()', function () {
    it('adds STOP mention when not present', function () {
        $result = $this->service->sanitizeStopMention('Hello World');
        expect($result)->toBe('Hello World STOP 36111');
    });

    it('does not duplicate STOP mention when already present', function () {
        $message = 'Hello World STOP 36111';
        $result = $this->service->sanitizeStopMention($message);
        expect($result)->toBe($message);
    });

    it('accepts custom stop number', function () {
        $result = $this->service->sanitizeStopMention('Hello World', '36107');
        expect($result)->toBe('Hello World STOP 36107');
    });
});

describe('truncate()', function () {
    it('does not truncate message within limit', function () {
        $message = 'Hello World';
        expect($this->service->truncate($message, 1))->toBe($message);
    });

    it('truncates long message to fit within maxSms', function () {
        $longMessage = str_repeat('a', 200);
        $result = $this->service->truncate($longMessage, 1);
        $count = $this->service->count($result);
        expect($count->messages)->toBeLessThanOrEqual(1);
    });

    it('truncates to fit within 2 SMS', function () {
        $longMessage = str_repeat('a', 400);
        $result = $this->service->truncate($longMessage, 2);
        $count = $this->service->count($result);
        expect($count->messages)->toBeLessThanOrEqual(2);
    });
});

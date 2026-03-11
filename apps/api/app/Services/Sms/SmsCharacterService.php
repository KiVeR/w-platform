<?php

declare(strict_types=1);

namespace App\Services\Sms;

use App\Enums\SmsEncoding;

/**
 * SMS utility service for character counting, encoding detection, and message manipulation.
 *
 * Ported from admin/app/Helpers/SMSCounter.php (instasent/sms-counter-php)
 */
class SmsCharacterService
{
    /**
     * GSM 7-bit basic character set (Unicode code points).
     *
     * @var array<int>
     */
    private const GSM_7BIT_MAP = [
        10, 12, 13, 32, 33, 34, 35, 36,
        37, 38, 39, 40, 41, 42, 43, 44,
        45, 46, 47, 48, 49, 50, 51, 52,
        53, 54, 55, 56, 57, 58, 59, 60,
        61, 62, 63, 64, 65, 66, 67, 68,
        69, 70, 71, 72, 73, 74, 75, 76,
        77, 78, 79, 80, 81, 82, 83, 84,
        85, 86, 87, 88, 89, 90, 91, 92,
        93, 94, 95, 97, 98, 99, 100, 101,
        102, 103, 104, 105, 106, 107, 108,
        109, 110, 111, 112, 113, 114, 115,
        116, 117, 118, 119, 120, 121, 122,
        123, 124, 125, 126, 161, 163, 164,
        165, 167, 191, 196, 197, 198,
        // 199 = Ç removed for commercial SMS
        201, 209, 214, 216, 220, 223, 224,
        228, 229, 230, 232, 233, 236, 241,
        242, 246, 248, 249, 252, 915, 916,
        920, 923, 926, 928, 931, 934, 936,
        937, 8364,
    ];

    /**
     * GSM 7-bit extended characters (require escape sequence, count as 2 chars).
     *
     * @var array<int>
     */
    private const GSM_7BIT_EXTENDED_MAP = [12, 91, 92, 93, 94, 123, 124, 125, 126, 8364];

    /**
     * Accent replacement map for sanitization.
     *
     * @var array<string, string>
     */
    private const ACCENT_MAP = [
        // Latin-1 Supplement
        'ª' => 'a', 'º' => 'o',
        'À' => 'A', 'Á' => 'A',
        'Â' => 'A', 'Ã' => 'A',
        'Ä' => 'A', 'Å' => 'A',
        'È' => 'E', 'É' => 'E',
        'Ê' => 'E', 'Ë' => 'E',
        'Ì' => 'I', 'Í' => 'I',
        'Î' => 'I', 'Ï' => 'I',
        'Ð' => 'D', 'Ñ' => 'N',
        'Ò' => 'O', 'Ó' => 'O',
        'Ô' => 'O', 'Õ' => 'O',
        'Ö' => 'O',
        'Ù' => 'U',
        'Ú' => 'U', 'Û' => 'U',
        'Ü' => 'U',
        'Ý' => 'Y',
        'Þ' => 'TH',
        'à' => 'a', 'á' => 'a',
        'â' => 'a', 'ã' => 'a',
        'ä' => 'a', 'å' => 'a',
        'ç' => 'c',
        'è' => 'e', 'é' => 'e',
        'ê' => 'e', 'ë' => 'e',
        'ì' => 'i', 'í' => 'i',
        'î' => 'i', 'ï' => 'i',
        'ð' => 'd', 'ñ' => 'n',
        'ò' => 'o', 'ó' => 'o',
        'ô' => 'o', 'õ' => 'o',
        'ö' => 'o',
        'ù' => 'u', 'ú' => 'u',
        'û' => 'u', 'ü' => 'u',
        'ý' => 'y', 'þ' => 'th',
        'ÿ' => 'y',
        // Latin Extended-A
        'Ā' => 'A', 'ā' => 'a',
        'Ă' => 'A', 'ă' => 'a',
        'Ą' => 'A', 'ą' => 'a',
        'Ç' => 'C',
        'Ć' => 'C', 'ć' => 'c',
        'Ĉ' => 'C', 'ĉ' => 'c',
        'Ċ' => 'C', 'ċ' => 'c',
        'Č' => 'C', 'č' => 'c',
        'Ď' => 'D', 'ď' => 'd',
        'Đ' => 'D', 'đ' => 'd',
        'Ē' => 'E', 'ē' => 'e',
        'Ĕ' => 'E', 'ĕ' => 'e',
        'Ė' => 'E', 'ė' => 'e',
        'Ę' => 'E', 'ę' => 'e',
        'Ě' => 'E', 'ě' => 'e',
        'Ĝ' => 'G', 'ĝ' => 'g',
        'Ğ' => 'G', 'ğ' => 'g',
        'Ġ' => 'G', 'ġ' => 'g',
        'Ģ' => 'G', 'ģ' => 'g',
        'Ĥ' => 'H', 'ĥ' => 'h',
        'Ħ' => 'H', 'ħ' => 'h',
        'Ĩ' => 'I', 'ĩ' => 'i',
        'Ī' => 'I', 'ī' => 'i',
        'Ĭ' => 'I', 'ĭ' => 'i',
        'Į' => 'I', 'į' => 'i',
        'İ' => 'I', 'ı' => 'i',
        'Ĳ' => 'IJ', 'ĳ' => 'ij',
        'Ĵ' => 'J', 'ĵ' => 'j',
        'Ķ' => 'K', 'ķ' => 'k',
        'ĸ' => 'k', 'Ĺ' => 'L',
        'ĺ' => 'l', 'Ļ' => 'L',
        'ļ' => 'l', 'Ľ' => 'L',
        'ľ' => 'l', 'Ŀ' => 'L',
        'ŀ' => 'l', 'Ł' => 'L',
        'ł' => 'l', 'Ń' => 'N',
        'ń' => 'n', 'Ņ' => 'N',
        'ņ' => 'n', 'Ň' => 'N',
        'ň' => 'n', 'ŉ' => 'n',
        'Ŋ' => 'N', 'ŋ' => 'n',
        'Ō' => 'O', 'ō' => 'o',
        'Ŏ' => 'O', 'ŏ' => 'o',
        'Ő' => 'O', 'ő' => 'o',
        'Œ' => 'OE', 'œ' => 'oe',
        'Ŕ' => 'R', 'ŕ' => 'r',
        'Ŗ' => 'R', 'ŗ' => 'r',
        'Ř' => 'R', 'ř' => 'r',
        'Ś' => 'S', 'ś' => 's',
        'Ŝ' => 'S', 'ŝ' => 's',
        'Ş' => 'S', 'ş' => 's',
        'Š' => 'S', 'š' => 's',
        'Ţ' => 'T', 'ţ' => 't',
        'Ť' => 'T', 'ť' => 't',
        'Ŧ' => 'T', 'ŧ' => 't',
        'Ũ' => 'U', 'ũ' => 'u',
        'Ū' => 'U', 'ū' => 'u',
        'Ŭ' => 'U', 'ŭ' => 'u',
        'Ů' => 'U', 'ů' => 'u',
        'Ű' => 'U', 'ű' => 'u',
        'Ų' => 'U', 'ų' => 'u',
        'Ŵ' => 'W', 'ŵ' => 'w',
        'Ŷ' => 'Y', 'ŷ' => 'y',
        'Ÿ' => 'Y', 'Ź' => 'Z',
        'ź' => 'z', 'Ż' => 'Z',
        'ż' => 'z', 'Ž' => 'Z',
        'ž' => 'z', 'ſ' => 's',
        // Latin Extended-B
        'Ș' => 'S', 'ș' => 's',
        'Ț' => 'T', 'ț' => 't',
        // Vietnamese vowels
        'Ơ' => 'O', 'ơ' => 'o',
        'Ư' => 'U', 'ư' => 'u',
        'Ầ' => 'A', 'ầ' => 'a',
        'Ằ' => 'A', 'ằ' => 'a',
        'Ề' => 'E', 'ề' => 'e',
        'Ồ' => 'O', 'ồ' => 'o',
        'Ờ' => 'O', 'ờ' => 'o',
        'Ừ' => 'U', 'ừ' => 'u',
        'Ỳ' => 'Y', 'ỳ' => 'y',
        'Ả' => 'A', 'ả' => 'a',
        'Ẩ' => 'A', 'ẩ' => 'a',
        'Ẳ' => 'A', 'ẳ' => 'a',
        'Ẻ' => 'E', 'ẻ' => 'e',
        'Ể' => 'E', 'ể' => 'e',
        'Ỉ' => 'I', 'ỉ' => 'i',
        'Ỏ' => 'O', 'ỏ' => 'o',
        'Ổ' => 'O', 'ổ' => 'o',
        'Ở' => 'O', 'ở' => 'o',
        'Ủ' => 'U', 'ủ' => 'u',
        'Ử' => 'U', 'ử' => 'u',
        'Ỷ' => 'Y', 'ỷ' => 'y',
        'Ẫ' => 'A', 'ẫ' => 'a',
        'Ẵ' => 'A', 'ẵ' => 'a',
        'Ẽ' => 'E', 'ẽ' => 'e',
        'Ễ' => 'E', 'ễ' => 'e',
        'Ỗ' => 'O', 'ỗ' => 'o',
        'Ỡ' => 'O', 'ỡ' => 'o',
        'Ữ' => 'U', 'ữ' => 'u',
        'Ỹ' => 'Y', 'ỹ' => 'y',
        'Ấ' => 'A', 'ấ' => 'a',
        'Ắ' => 'A', 'ắ' => 'a',
        'Ế' => 'E', 'ế' => 'e',
        'Ố' => 'O', 'ố' => 'o',
        'Ớ' => 'O', 'ớ' => 'o',
        'Ứ' => 'U', 'ứ' => 'u',
        'Ạ' => 'A', 'ạ' => 'a',
        'Ậ' => 'A', 'ậ' => 'a',
        'Ặ' => 'A', 'ặ' => 'a',
        'Ẹ' => 'E', 'ẹ' => 'e',
        'Ệ' => 'E', 'ệ' => 'e',
        'Ị' => 'I', 'ị' => 'i',
        'Ọ' => 'O', 'ọ' => 'o',
        'Ộ' => 'O', 'ộ' => 'o',
        'Ợ' => 'O', 'ợ' => 'o',
        'Ụ' => 'U', 'ụ' => 'u',
        'Ự' => 'U', 'ự' => 'u',
        'Ỵ' => 'Y', 'ỵ' => 'y',
        // Chinese Pinyin
        'ɑ' => 'a',
        'Ǖ' => 'U', 'ǖ' => 'u',
        'Ǘ' => 'U', 'ǘ' => 'u',
        'Ǎ' => 'A', 'ǎ' => 'a',
        'Ǐ' => 'I', 'ǐ' => 'i',
        'Ǒ' => 'O', 'ǒ' => 'o',
        'Ǔ' => 'U', 'ǔ' => 'u',
        'Ǚ' => 'U', 'ǚ' => 'u',
        'Ǜ' => 'U', 'ǜ' => 'u',
        // Spaces and quotes
        "\u{00A0}" => ' ', "\u{202F}" => ' ',
        "\u{2018}" => "'", '`' => "'",
        "\u{2019}" => "'",
    ];

    /**
     * Cached GSM 7-bit extended map for faster lookups.
     *
     * @var array<int>|null
     */
    private ?array $gsm7bitExMapCache = null;

    /**
     * Count characters and SMS messages for a given text.
     */
    public function count(string $text): SmsCountResult
    {
        $unicodeArray = $this->utf8ToUnicode($text);
        $exChars = [];
        $encoding = $this->detectEncodingFromArray($unicodeArray, $exChars);

        $length = count($unicodeArray);

        if ($encoding === SmsEncoding::GSM_7BIT_EX) {
            // Each extended char takes 2 positions (escape + char)
            $length += count($exChars);
        } elseif ($encoding === SmsEncoding::UTF16) {
            // Unicode chars over U+10000 occupy an extra position
            foreach ($unicodeArray as $char) {
                if ($char >= 65536) {
                    $length++;
                }
            }
        }

        // Determine per-message limit based on encoding and length
        $perMessage = match ($encoding) {
            SmsEncoding::GSM_7BIT => $length > 160 ? 153 : 160,
            SmsEncoding::GSM_7BIT_EX => $length > 160 ? 153 : 160,
            SmsEncoding::UTF16 => $length > 70 ? 67 : 70,
        };

        $messages = $length > 0 ? (int) ceil($length / $perMessage) : 0;

        // Calculate remaining characters
        if ($encoding === SmsEncoding::UTF16 && $length > $perMessage) {
            $count = 0;
            foreach ($unicodeArray as $char) {
                if ($count === $perMessage) {
                    $count = 0;
                } elseif ($count > $perMessage) {
                    $count = 2;
                }
                $count += $char >= 65536 ? 2 : 1;
            }
            $remaining = $perMessage - ($count > $perMessage ? 2 : $count);
        } else {
            $remaining = $messages > 0 ? ($perMessage * $messages) - $length : 0;
        }

        return new SmsCountResult(
            encoding: $encoding,
            length: $length,
            messages: $messages,
            perMessage: $perMessage,
            remaining: $remaining,
        );
    }

    /**
     * Detect the encoding type of a message.
     */
    public function detectEncoding(string $text): SmsEncoding
    {
        $unicodeArray = $this->utf8ToUnicode($text);
        $exChars = [];

        return $this->detectEncodingFromArray($unicodeArray, $exChars);
    }

    /**
     * Check if a message is GSM-7 compatible (not UTF-16).
     */
    public function isGsmCompatible(string $text): bool
    {
        return $this->detectEncoding($text) !== SmsEncoding::UTF16;
    }

    /**
     * Remove accents from a string (transliteration).
     */
    public function removeAccents(string $str): string
    {
        if (! preg_match('/[\x80-\xff]/', $str)) {
            return $str;
        }

        return strtr($str, self::ACCENT_MAP);
    }

    /**
     * Sanitize a message to GSM-7 compatible characters.
     * Removes accents and non-GSM characters.
     */
    public function sanitizeToGsm(string $str): string
    {
        $str = $this->removeAccents($str);

        return $this->removeNonGsmChars($str);
    }

    /**
     * Add STOP mention to a message if not already present.
     * Accepts the stop number directly (e.g. '36111').
     */
    public function sanitizeStopMention(string $message, string $stopNumber = '36111'): string
    {
        if ($this->hasStopMention($message)) {
            return $message;
        }

        return $message.' STOP '.$stopNumber;
    }

    /**
     * Check if a message already contains a STOP mention.
     */
    public function hasStopMention(string $message): bool
    {
        return (bool) preg_match('/\bSTOP\s+\d{5}\b/i', $message);
    }

    /**
     * Truncate a message to fit within a maximum number of SMS.
     */
    public function truncate(string $str, int $maxSms): string
    {
        $count = $this->count($str);

        if ($count->messages <= $maxSms) {
            return $str;
        }

        $encoding = $count->encoding;

        // Determine the character limit for the target SMS count
        if ($encoding === SmsEncoding::UTF16) {
            $limit = $maxSms > 1 ? 67 : 70;
        } else {
            $limit = $maxSms > 1 ? 153 : 160;
        }

        $targetLength = $limit * $maxSms;

        // Iteratively truncate until we fit
        do {
            $str = mb_substr($str, 0, $targetLength);
            $count = $this->count($str);
            $targetLength--;
        } while ($count->messages > $maxSms && $targetLength > 0);

        return $str;
    }

    /**
     * Detect encoding from a Unicode array.
     *
     * @param  array<int>  $text
     * @param  array<int>  $exChars  Will be populated with extended character positions
     */
    private function detectEncodingFromArray(array $text, array &$exChars): SmsEncoding
    {
        $gsm7bitExMap = $this->getGsm7bitExMap();

        // Check for UTF-16 characters (not in GSM map)
        $utf16Chars = array_diff($text, $gsm7bitExMap);
        if (count($utf16Chars) > 0) {
            return SmsEncoding::UTF16;
        }

        // Check for extended GSM characters
        $exChars = array_intersect($text, self::GSM_7BIT_EXTENDED_MAP);
        if (count($exChars) > 0) {
            return SmsEncoding::GSM_7BIT_EX;
        }

        return SmsEncoding::GSM_7BIT;
    }

    /**
     * Get the combined GSM 7-bit + extended map.
     *
     * @return array<int>
     */
    private function getGsm7bitExMap(): array
    {
        if ($this->gsm7bitExMapCache === null) {
            $this->gsm7bitExMapCache = array_merge(
                self::GSM_7BIT_MAP,
                self::GSM_7BIT_EXTENDED_MAP
            );
        }

        return $this->gsm7bitExMapCache;
    }

    /**
     * Remove non-GSM characters from a string.
     */
    private function removeNonGsmChars(string $str): string
    {
        $validChars = $this->getGsm7bitExMap();
        $allChars = $this->utf8ToUnicode($str);
        $result = [];

        foreach ($allChars as $char) {
            if (in_array($char, $validChars, true)) {
                $result[] = $char;
            }
        }

        return $this->unicodeToUtf8($result);
    }

    /**
     * Convert UTF-8 string to array of Unicode code points.
     *
     * @return array<int>
     */
    private function utf8ToUnicode(string $str): array
    {
        $unicode = [];
        $values = [];
        $lookingFor = 1;
        $len = strlen($str);

        for ($i = 0; $i < $len; $i++) {
            $thisValue = ord($str[$i]);

            if ($thisValue < 128) {
                $unicode[] = $thisValue;

                continue;
            }

            if (count($values) === 0) {
                $lookingFor = match (true) {
                    $thisValue >= 240 => 4,
                    $thisValue >= 224 => 3,
                    default => 2,
                };
            }

            $values[] = $thisValue;

            if (count($values) === $lookingFor) {
                $number = match ($lookingFor) {
                    4 => (($values[0] % 16) * 262144) + (($values[1] % 64) * 4096) + (($values[2] % 64) * 64) + ($values[3] % 64),
                    3 => (($values[0] % 16) * 4096) + (($values[1] % 64) * 64) + ($values[2] % 64),
                    default => (($values[0] % 32) * 64) + ($values[1] % 64),
                };

                $unicode[] = $number;
                $values = [];
                $lookingFor = 1;
            }
        }

        return $unicode;
    }

    /**
     * Convert Unicode code point to UTF-8 character.
     */
    private function utf8Chr(int $unicode): string
    {
        if ($unicode < 128) {
            return chr($unicode);
        }

        if ($unicode < 2048) {
            return chr(192 | ($unicode >> 6)).chr(128 | ($unicode & 0x3F));
        }

        if ($unicode < 65536) {
            return chr(224 | ($unicode >> 12)).chr(128 | (($unicode >> 6) & 0x3F)).chr(128 | ($unicode & 0x3F));
        }

        return chr(240 | ($unicode >> 18))
            .chr(128 | (($unicode >> 12) & 0x3F))
            .chr(128 | (($unicode >> 6) & 0x3F))
            .chr(128 | ($unicode & 0x3F));
    }

    /**
     * Convert array of Unicode code points to UTF-8 string.
     *
     * @param  array<int>  $array
     */
    private function unicodeToUtf8(array $array): string
    {
        $str = '';
        foreach ($array as $codePoint) {
            $str .= $this->utf8Chr($codePoint);
        }

        return $str;
    }
}

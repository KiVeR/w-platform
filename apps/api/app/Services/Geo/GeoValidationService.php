<?php

declare(strict_types=1);

namespace App\Services\Geo;

/**
 * Geographic utilities for French postcodes, departments, and IRIS codes.
 *
 * Ported from:
 * - adv/public/js/fileAnalyzer.js (regex validation)
 * - admin/app/Models/Postcode.php & Iris.php (data structures)
 */
class GeoValidationService
{
    private const POSTCODE_PATTERN = '/^((0[1-9])|([1-8][0-9])|(9[0-7])|(2A)|(2B))[0-9]{3}$/';

    private const DEPARTMENT_PATTERN = '/^((0[1-9])|([1-9][0-9])|(2[AB])|(97[1-6]))$/i';

    private const IRIS_PATTERN = '/^[0-9]{9}$/';

    /**
     * Format a postcode to 5 characters (left-padded with zeros).
     */
    public function formatPostcode(string $code): string
    {
        // Handle Corsica (2A, 2B)
        $code = strtoupper(trim($code));

        if (preg_match('/^2[AB]/i', $code)) {
            return str_pad($code, 5, '0', STR_PAD_RIGHT);
        }

        return str_pad(preg_replace('/[^0-9]/', '', $code) ?? '', 5, '0', STR_PAD_LEFT);
    }

    /**
     * Check if a postcode is valid (French format).
     */
    public function isValidPostcode(string $code): bool
    {
        $code = strtoupper(trim($code));

        return (bool) preg_match(self::POSTCODE_PATTERN, $code);
    }

    /**
     * Check if a department code is valid.
     */
    public function isValidDepartment(string $dept): bool
    {
        $dept = strtoupper(trim($dept));

        return (bool) preg_match(self::DEPARTMENT_PATTERN, $dept);
    }

    /**
     * Check if an IRIS code is valid (9 digits).
     */
    public function isValidIris(string $iris): bool
    {
        return (bool) preg_match(self::IRIS_PATTERN, $iris);
    }

    /**
     * Parse an IRIS code into its components.
     */
    public function parseIris(string $iris): IrisData
    {
        return IrisData::fromString($iris);
    }

    /**
     * Extract the department code from a postcode.
     */
    public function getDepartment(string $postcode): string
    {
        $postcode = strtoupper(trim($postcode));

        // Handle Corsica (2A, 2B)
        if (preg_match('/^(2[AB])/', $postcode, $matches)) {
            return $matches[1];
        }

        // Handle DOM-TOM (97x)
        if (str_starts_with($postcode, '97')) {
            return substr($postcode, 0, 3);
        }

        // Standard departments (2 digits)
        return substr($postcode, 0, 2);
    }

    /**
     * Check if a postcode is in Paris, Lyon, or Marseille (cities with arrondissements).
     */
    public function isParisLyonMarseille(string $postcode): bool
    {
        $postcode = $this->formatPostcode($postcode);

        // Paris: 75001-75020
        if (preg_match('/^750[0-2][0-9]$/', $postcode) && (int) $postcode <= 75020) {
            return true;
        }

        // Lyon: 69001-69009
        if (preg_match('/^6900[1-9]$/', $postcode)) {
            return true;
        }

        // Marseille: 13001-13016
        if (preg_match('/^130[01][0-9]$/', $postcode) && (int) $postcode <= 13016 && (int) $postcode >= 13001) {
            return true;
        }

        return false;
    }

    /**
     * Get the list of arrondissement postcodes for a city.
     *
     * @return array<string, string> Array of postcode => insee code
     */
    public function getArrondissements(string $city): array
    {
        $city = strtolower(trim($city));

        return match ($city) {
            'paris' => config('geo.paris_arrondissements', []),
            'lyon' => config('geo.lyon_arrondissements', []),
            'marseille' => config('geo.marseille_arrondissements', []),
            default => [],
        };
    }

    /**
     * Get the INSEE code for an arrondissement postcode.
     */
    public function getInseeFromArrondissement(string $postcode): ?string
    {
        $postcode = $this->formatPostcode($postcode);

        // Check Paris
        $paris = config('geo.paris_arrondissements', []);
        if (isset($paris[$postcode])) {
            return $paris[$postcode];
        }

        // Check Lyon
        $lyon = config('geo.lyon_arrondissements', []);
        if (isset($lyon[$postcode])) {
            return $lyon[$postcode];
        }

        // Check Marseille
        $marseille = config('geo.marseille_arrondissements', []);
        if (isset($marseille[$postcode])) {
            return $marseille[$postcode];
        }

        return null;
    }

    /**
     * Check if a postcode is in metropolitan France (excludes DOM-TOM).
     */
    public function isMetropolitanFrance(string $postcode): bool
    {
        $postcode = $this->formatPostcode($postcode);

        // DOM-TOM start with 97
        return ! str_starts_with($postcode, '97');
    }

    /**
     * Check if a postcode is in Corsica.
     */
    public function isCorsica(string $postcode): bool
    {
        $postcode = strtoupper($this->formatPostcode($postcode));

        return (bool) preg_match('/^(2[AB]|20)/', $postcode);
    }

    /**
     * Check if a postcode is in DOM-TOM.
     */
    public function isDomTom(string $postcode): bool
    {
        $postcode = $this->formatPostcode($postcode);

        return str_starts_with($postcode, '97');
    }

    /**
     * Get the region name from a department code.
     *
     * @return string|null Region name or null if not found
     */
    public function getRegionFromDepartment(string $dept): ?string
    {
        $dept = strtoupper(trim($dept));

        $regions = [
            // Auvergne-Rhône-Alpes
            '01' => 'Auvergne-Rhône-Alpes', '03' => 'Auvergne-Rhône-Alpes', '07' => 'Auvergne-Rhône-Alpes',
            '15' => 'Auvergne-Rhône-Alpes', '26' => 'Auvergne-Rhône-Alpes', '38' => 'Auvergne-Rhône-Alpes',
            '42' => 'Auvergne-Rhône-Alpes', '43' => 'Auvergne-Rhône-Alpes', '63' => 'Auvergne-Rhône-Alpes',
            '69' => 'Auvergne-Rhône-Alpes', '73' => 'Auvergne-Rhône-Alpes', '74' => 'Auvergne-Rhône-Alpes',
            // Bourgogne-Franche-Comté
            '21' => 'Bourgogne-Franche-Comté', '25' => 'Bourgogne-Franche-Comté', '39' => 'Bourgogne-Franche-Comté',
            '58' => 'Bourgogne-Franche-Comté', '70' => 'Bourgogne-Franche-Comté', '71' => 'Bourgogne-Franche-Comté',
            '89' => 'Bourgogne-Franche-Comté', '90' => 'Bourgogne-Franche-Comté',
            // Bretagne
            '22' => 'Bretagne', '29' => 'Bretagne', '35' => 'Bretagne', '56' => 'Bretagne',
            // Centre-Val de Loire
            '18' => 'Centre-Val de Loire', '28' => 'Centre-Val de Loire', '36' => 'Centre-Val de Loire',
            '37' => 'Centre-Val de Loire', '41' => 'Centre-Val de Loire', '45' => 'Centre-Val de Loire',
            // Corse
            '2A' => 'Corse', '2B' => 'Corse',
            // Grand Est
            '08' => 'Grand Est', '10' => 'Grand Est', '51' => 'Grand Est', '52' => 'Grand Est',
            '54' => 'Grand Est', '55' => 'Grand Est', '57' => 'Grand Est', '67' => 'Grand Est',
            '68' => 'Grand Est', '88' => 'Grand Est',
            // Hauts-de-France
            '02' => 'Hauts-de-France', '59' => 'Hauts-de-France', '60' => 'Hauts-de-France',
            '62' => 'Hauts-de-France', '80' => 'Hauts-de-France',
            // Île-de-France
            '75' => 'Île-de-France', '77' => 'Île-de-France', '78' => 'Île-de-France',
            '91' => 'Île-de-France', '92' => 'Île-de-France', '93' => 'Île-de-France',
            '94' => 'Île-de-France', '95' => 'Île-de-France',
            // Normandie
            '14' => 'Normandie', '27' => 'Normandie', '50' => 'Normandie', '61' => 'Normandie', '76' => 'Normandie',
            // Nouvelle-Aquitaine
            '16' => 'Nouvelle-Aquitaine', '17' => 'Nouvelle-Aquitaine', '19' => 'Nouvelle-Aquitaine',
            '23' => 'Nouvelle-Aquitaine', '24' => 'Nouvelle-Aquitaine', '33' => 'Nouvelle-Aquitaine',
            '40' => 'Nouvelle-Aquitaine', '47' => 'Nouvelle-Aquitaine', '64' => 'Nouvelle-Aquitaine',
            '79' => 'Nouvelle-Aquitaine', '86' => 'Nouvelle-Aquitaine', '87' => 'Nouvelle-Aquitaine',
            // Occitanie
            '09' => 'Occitanie', '11' => 'Occitanie', '12' => 'Occitanie', '30' => 'Occitanie',
            '31' => 'Occitanie', '32' => 'Occitanie', '34' => 'Occitanie', '46' => 'Occitanie',
            '48' => 'Occitanie', '65' => 'Occitanie', '66' => 'Occitanie', '81' => 'Occitanie', '82' => 'Occitanie',
            // Pays de la Loire
            '44' => 'Pays de la Loire', '49' => 'Pays de la Loire', '53' => 'Pays de la Loire',
            '72' => 'Pays de la Loire', '85' => 'Pays de la Loire',
            // Provence-Alpes-Côte d'Azur
            '04' => "Provence-Alpes-Côte d'Azur", '05' => "Provence-Alpes-Côte d'Azur",
            '06' => "Provence-Alpes-Côte d'Azur", '13' => "Provence-Alpes-Côte d'Azur",
            '83' => "Provence-Alpes-Côte d'Azur", '84' => "Provence-Alpes-Côte d'Azur",
            // DOM-TOM
            '971' => 'Guadeloupe', '972' => 'Martinique', '973' => 'Guyane',
            '974' => 'La Réunion', '976' => 'Mayotte',
        ];

        return $regions[$dept] ?? null;
    }
}

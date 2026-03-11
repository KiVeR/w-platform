<?php

declare(strict_types=1);

namespace App\Services\AI;

class ContrastValidationService
{
    private const WCAG_AA_RATIO = 4.5;

    private const TEXT_COLOR_PROPERTIES = ['color', 'titleColor', 'subtitleColor', 'labelColor'];

    /**
     * Get WCAG contrast ratio between two hex colors.
     */
    public static function getContrastRatio(string $fg, string $bg): float
    {
        $fgLum = self::getLuminance($fg);
        $bgLum = self::getLuminance($bg);

        $lighter = max($fgLum, $bgLum);
        $darker = min($fgLum, $bgLum);

        return ($lighter + 0.05) / ($darker + 0.05);
    }

    /**
     * Validate contrast for all text elements in a design.
     *
     * @param  array<string, mixed>  $design
     * @return array{valid: bool, violations: array<int, array<string, mixed>>, passRate: float}
     */
    public static function validateDesignContrast(array $design): array
    {
        $widgets = isset($design['widgets']) && is_array($design['widgets'])
            ? $design['widgets']
            : [];

        $globalStyles = isset($design['globalStyles']) && is_array($design['globalStyles'])
            ? $design['globalStyles']
            : [];

        $globalBg = (string) ($globalStyles['backgroundColor'] ?? '#ffffff');
        if (! self::isValidHexColor($globalBg)) {
            $globalBg = '#ffffff';
        }

        $violations = [];
        self::walkTreeForViolations($widgets, $globalBg, $violations);

        $totalChecks = 0;
        self::countTextColorChecks($widgets, $totalChecks);

        $violationCount = count($violations);
        $passRate = $totalChecks > 0
            ? ($totalChecks - $violationCount) / $totalChecks
            : 1.0;

        return [
            'valid' => $violationCount === 0,
            'violations' => $violations,
            'passRate' => $passRate,
        ];
    }

    /**
     * Auto-fix contrast violations in a design.
     *
     * @param  array<string, mixed>  $design
     * @return array<string, mixed>
     */
    public static function autoFixContrast(array $design): array
    {
        $result = self::validateDesignContrast($design);
        $violations = $result['violations'];

        if (empty($violations)) {
            return $design;
        }

        // Build fix map: "widgetId:property" => recommendation
        /** @var array<string, string> $fixMap */
        $fixMap = [];
        foreach ($violations as $violation) {
            $widgetId = (string) ($violation['widgetId'] ?? '');
            $property = (string) ($violation['property'] ?? '');
            $recommendation = (string) ($violation['recommendation'] ?? '#1a1a1a');
            $fixMap["{$widgetId}:{$property}"] = $recommendation;
        }

        if (isset($design['widgets']) && is_array($design['widgets'])) {
            $design['widgets'] = self::applyFixesToWidgets($design['widgets'], $fixMap);
        }

        return $design;
    }

    /**
     * Convert hex color to [r, g, b] array.
     *
     * @return array{0: int, 1: int, 2: int}
     */
    private static function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');

        // Handle shorthand #abc → #aabbcc
        if (strlen($hex) === 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }

        return [
            (int) hexdec(substr($hex, 0, 2)),
            (int) hexdec(substr($hex, 2, 2)),
            (int) hexdec(substr($hex, 4, 2)),
        ];
    }

    /**
     * Calculate relative luminance for a hex color (WCAG formula).
     */
    private static function getLuminance(string $hex): float
    {
        [$r, $g, $b] = self::hexToRgb($hex);

        $channels = [$r / 255.0, $g / 255.0, $b / 255.0];
        $linearized = array_map(static function (float $srgb): float {
            return $srgb <= 0.03928
                ? $srgb / 12.92
                : (($srgb + 0.055) / 1.055) ** 2.4;
        }, $channels);

        return 0.2126 * $linearized[0] + 0.7152 * $linearized[1] + 0.0722 * $linearized[2];
    }

    /**
     * Returns true if the background color is light (luminance > 0.5).
     */
    private static function isLightBackground(string $hex): bool
    {
        return self::getLuminance($hex) > 0.5;
    }

    /**
     * Suggest a contrasting color for the given background.
     */
    private static function suggestContrastingColor(string $bg): string
    {
        return self::isLightBackground($bg) ? '#1a1a1a' : '#ffffff';
    }

    /**
     * Check if a value is a valid hex color (#rgb or #rrggbb).
     */
    private static function isValidHexColor(mixed $value): bool
    {
        if (! is_string($value)) {
            return false;
        }

        return (bool) preg_match('/^#([0-9a-f]{3}|[0-9a-f]{6})$/i', $value);
    }

    /**
     * Walk the widget tree and collect contrast violations.
     *
     * @param  array<int, array<string, mixed>>  $widgets
     * @param  array<int, array<string, mixed>>  $violations
     */
    private static function walkTreeForViolations(
        array $widgets,
        string $parentBg,
        array &$violations
    ): void {
        foreach ($widgets as $widget) {
            $widgetId = (string) ($widget['id'] ?? '');
            $widgetType = (string) ($widget['type'] ?? '');
            $styles = isset($widget['styles']) && is_array($widget['styles']) ? $widget['styles'] : [];
            $content = isset($widget['content']) && is_array($widget['content']) ? $widget['content'] : [];

            // Determine effective background for this widget
            $bg = $parentBg;
            if (isset($styles['backgroundColor']) && self::isValidHexColor($styles['backgroundColor'])) {
                $bg = (string) $styles['backgroundColor'];
            }

            // Check text color properties in both styles and content
            $sources = ['styles' => $styles, 'content' => $content];
            foreach ($sources as $source) {
                foreach (self::TEXT_COLOR_PROPERTIES as $prop) {
                    if (! isset($source[$prop])) {
                        continue;
                    }

                    $textColor = $source[$prop];
                    if (! self::isValidHexColor($textColor)) {
                        continue;
                    }

                    $textColor = (string) $textColor;
                    $ratio = self::getContrastRatio($textColor, $bg);

                    if ($ratio < self::WCAG_AA_RATIO) {
                        $violations[] = [
                            'widgetId' => $widgetId,
                            'widgetType' => $widgetType,
                            'property' => $prop,
                            'textColor' => $textColor,
                            'backgroundColor' => $bg,
                            'contrastRatio' => $ratio,
                            'recommendation' => self::suggestContrastingColor($bg),
                        ];
                    }
                }
            }

            // Recurse into children
            if (isset($widget['children']) && is_array($widget['children'])) {
                self::walkTreeForViolations($widget['children'], $bg, $violations);
            }
        }
    }

    /**
     * Count total text color property checks in the widget tree.
     *
     * @param  array<int, array<string, mixed>>  $widgets
     */
    private static function countTextColorChecks(array $widgets, int &$count): void
    {
        foreach ($widgets as $widget) {
            $styles = isset($widget['styles']) && is_array($widget['styles']) ? $widget['styles'] : [];
            $content = isset($widget['content']) && is_array($widget['content']) ? $widget['content'] : [];

            foreach ([$styles, $content] as $source) {
                foreach (self::TEXT_COLOR_PROPERTIES as $prop) {
                    if (isset($source[$prop]) && self::isValidHexColor($source[$prop])) {
                        $count++;
                    }
                }
            }

            if (isset($widget['children']) && is_array($widget['children'])) {
                self::countTextColorChecks($widget['children'], $count);
            }
        }
    }

    /**
     * Apply fixes from fixMap to all widgets recursively.
     *
     * @param  array<int, array<string, mixed>>  $widgets
     * @param  array<string, string>  $fixMap
     * @return array<int, array<string, mixed>>
     */
    private static function applyFixesToWidgets(array $widgets, array $fixMap): array
    {
        foreach ($widgets as &$widget) {
            $widgetId = (string) ($widget['id'] ?? '');

            foreach (self::TEXT_COLOR_PROPERTIES as $prop) {
                $key = "{$widgetId}:{$prop}";

                if (! isset($fixMap[$key])) {
                    continue;
                }

                $recommendation = $fixMap[$key];

                // Fix in styles
                if (isset($widget['styles'][$prop]) && self::isValidHexColor($widget['styles'][$prop])) {
                    $widget['styles'][$prop] = $recommendation;
                }

                // Fix in content
                if (isset($widget['content'][$prop]) && self::isValidHexColor($widget['content'][$prop])) {
                    $widget['content'][$prop] = $recommendation;
                }
            }

            if (isset($widget['children']) && is_array($widget['children'])) {
                $widget['children'] = self::applyFixesToWidgets($widget['children'], $fixMap);
            }
        }

        return $widgets;
    }
}

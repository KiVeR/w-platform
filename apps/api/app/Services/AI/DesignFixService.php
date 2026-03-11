<?php

declare(strict_types=1);

namespace App\Services\AI;

class DesignFixService
{
    private static int $widgetCounter = 0;

    /**
     * Parse a raw AI response text into a design array.
     * Strips markdown fences and finds the outermost JSON object.
     *
     * @return array<string, mixed>|null
     */
    public static function parseDesignResponse(string $raw): ?array
    {
        // Strip markdown fences (```json ... ```)
        $cleaned = preg_replace('/```json\s*/i', '', $raw) ?? $raw;
        $cleaned = preg_replace('/```\s*/m', '', $cleaned) ?? $cleaned;
        $cleaned = trim($cleaned);

        // Find outermost { ... }
        $start = strpos($cleaned, '{');
        $end = strrpos($cleaned, '}');

        if ($start === false || $end === false || $end <= $start) {
            return null;
        }

        $jsonStr = substr($cleaned, $start, $end - $start + 1);

        /** @var array<string, mixed>|null $decoded */
        $decoded = json_decode($jsonStr, true);

        if (! is_array($decoded)) {
            return null;
        }

        return $decoded;
    }

    /**
     * Fix parent-child constraint violations.
     * - Column cannot contain row or column → flatten illegal child's children
     * - Row can only contain column → wrap non-column children in a column
     *
     * @param  array<int, array<string, mixed>>  $widgets
     * @return array<int, array<string, mixed>>
     */
    public static function fixParentChildConstraints(array $widgets, ?string $parentType = null): array
    {
        $result = [];

        foreach ($widgets as $widget) {
            $type = (string) ($widget['type'] ?? '');
            $children = isset($widget['children']) && is_array($widget['children'])
                ? $widget['children']
                : [];

            if ($parentType === 'column' && ($type === 'row' || $type === 'column')) {
                // Column cannot contain row or column → flatten: replace this widget with its children
                $fixedChildren = self::fixParentChildConstraints($children, $parentType);
                foreach ($fixedChildren as $child) {
                    $result[] = $child;
                }

                continue;
            }

            if ($parentType === 'row' && $type !== 'column') {
                // Row can only contain column → wrap non-column children in a column
                $fixedChildren = self::fixParentChildConstraints($children, $type);
                $wrapper = [
                    'type' => 'column',
                    'content' => isset($widget['content']) && is_array($widget['content']) ? $widget['content'] : [],
                    'styles' => isset($widget['styles']) && is_array($widget['styles']) ? $widget['styles'] : [],
                    'children' => [$widget + ['children' => $fixedChildren]],
                ];
                $result[] = $wrapper;

                continue;
            }

            // Recurse into children
            if (! empty($children)) {
                $widget['children'] = self::fixParentChildConstraints($children, $type);
            }

            $result[] = $widget;
        }

        return $result;
    }

    /**
     * Fix widget IDs and order.
     * Each widget gets a unique ID (widget_1, widget_2...), order = array index.
     * Ensures content and styles arrays exist. Recurses into children.
     *
     * @param  array<int, array<string, mixed>>  $widgets
     * @return array<int, array<string, mixed>>
     */
    public static function fixWidgetIdsAndOrder(array $widgets): array
    {
        $result = [];

        foreach ($widgets as $index => $widget) {
            self::$widgetCounter++;
            $widget['id'] = 'widget_'.self::$widgetCounter;
            $widget['order'] = $index;

            if (! isset($widget['content']) || ! is_array($widget['content'])) {
                $widget['content'] = [];
            }

            if (! isset($widget['styles']) || ! is_array($widget['styles'])) {
                $widget['styles'] = [];
            }

            if (isset($widget['children']) && is_array($widget['children'])) {
                $widget['children'] = self::fixWidgetIdsAndOrder($widget['children']);
            }

            $result[] = $widget;
        }

        return $result;
    }

    /**
     * Ensure every form widget has a submit button as its last child.
     *
     * @param  array<int, array<string, mixed>>  $widgets
     * @return array<int, array<string, mixed>>
     */
    public static function ensureFormSubmitButton(array $widgets): array
    {
        $result = [];

        foreach ($widgets as $widget) {
            $type = (string) ($widget['type'] ?? '');

            if ($type === 'form') {
                $children = isset($widget['children']) && is_array($widget['children'])
                    ? $widget['children']
                    : [];

                // Recurse into children first
                $children = self::ensureFormSubmitButton($children);

                // Check if the last child is a button
                $lastChild = ! empty($children) ? end($children) : null;
                $lastType = $lastChild !== null
                    ? (string) ($lastChild['type'] ?? '')
                    : '';

                if ($lastType !== 'button') {
                    $children[] = [
                        'type' => 'button',
                        'content' => [
                            'text' => 'Envoyer',
                            'url' => '',
                        ],
                        'styles' => [
                            'margin' => '8px',
                        ],
                    ];
                }

                $widget['children'] = $children;
            } elseif (isset($widget['children']) && is_array($widget['children'])) {
                $widget['children'] = self::ensureFormSubmitButton($widget['children']);
            }

            $result[] = $widget;
        }

        return $result;
    }

    /**
     * Apply all design fixes in the correct order:
     * fixParentChildConstraints → ensureFormSubmitButton → fixWidgetIdsAndOrder
     *
     * @param  array<string, mixed>  $design
     * @return array<string, mixed>
     */
    public static function applyAllFixes(array $design): array
    {
        // Ensure version exists
        if (! isset($design['version'])) {
            $design['version'] = '1.0';
        }

        // Ensure globalStyles object exists
        if (! isset($design['globalStyles']) || ! is_array($design['globalStyles'])) {
            $design['globalStyles'] = [
                'backgroundColor' => '#ffffff',
            ];
        }

        // Ensure widgets array exists
        if (! isset($design['widgets']) || ! is_array($design['widgets'])) {
            $design['widgets'] = [];
        }

        // Reset counter for deterministic IDs
        self::$widgetCounter = 0;

        $widgets = $design['widgets'];
        $widgets = self::fixParentChildConstraints($widgets);
        $widgets = self::ensureFormSubmitButton($widgets);
        $widgets = self::fixWidgetIdsAndOrder($widgets);

        $design['widgets'] = $widgets;

        return $design;
    }
}

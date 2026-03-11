<?php

declare(strict_types=1);

use App\Services\AI\ContrastValidationService;

describe('ContrastValidationService', function () {

    describe('getContrastRatio', function () {

        it('returns ~21:1 for black on white', function () {
            $ratio = ContrastValidationService::getContrastRatio('#000000', '#ffffff');
            expect($ratio)->toBeGreaterThan(20.0);
        });

        it('returns 1:1 for same color', function () {
            $ratio = ContrastValidationService::getContrastRatio('#ffffff', '#ffffff');
            expect($ratio)->toEqualWithDelta(1.0, 0.001);
        });

        it('returns same ratio regardless of fg/bg order (symmetric)', function () {
            $ratio1 = ContrastValidationService::getContrastRatio('#000000', '#ffffff');
            $ratio2 = ContrastValidationService::getContrastRatio('#ffffff', '#000000');
            expect($ratio1)->toEqualWithDelta($ratio2, 0.001);
        });

        it('handles shorthand hex colors', function () {
            // #000 = #000000, #fff = #ffffff
            $ratio = ContrastValidationService::getContrastRatio('#000', '#fff');
            expect($ratio)->toBeGreaterThan(20.0);
        });

    });

    describe('validateDesignContrast', function () {

        it('returns valid=true when no violations', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => ['color' => '#000000'],
                        'content' => [],
                    ],
                ],
            ];
            $result = ContrastValidationService::validateDesignContrast($design);
            expect($result['valid'])->toBeTrue()
                ->and($result['violations'])->toBeEmpty()
                ->and($result['passRate'])->toEqualWithDelta(1.0, 0.001);
        });

        it('detects contrast violation for light text on light background', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => ['color' => '#cccccc'],  // Light gray on white — fails WCAG AA
                        'content' => [],
                    ],
                ],
            ];
            $result = ContrastValidationService::validateDesignContrast($design);
            expect($result['valid'])->toBeFalse()
                ->and($result['violations'])->toHaveCount(1)
                ->and($result['violations'][0]['widgetId'])->toBe('widget_1')
                ->and($result['violations'][0]['property'])->toBe('color');
        });

        it('checks titleColor, subtitleColor, labelColor properties', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => [
                            'titleColor' => '#dddddd',    // Fails
                            'subtitleColor' => '#eeeeee', // Fails
                            'labelColor' => '#999999',    // Might fail
                        ],
                        'content' => [],
                    ],
                ],
            ];
            $result = ContrastValidationService::validateDesignContrast($design);
            expect($result['violations'])->not->toBeEmpty();
        });

        it('inherits background from parent widget', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'column',
                        'styles' => ['backgroundColor' => '#000000'],  // Dark background
                        'content' => [],
                        'children' => [
                            [
                                'id' => 'widget_2',
                                'type' => 'text',
                                'styles' => ['color' => '#111111'],  // Dark text on dark bg — fails
                                'content' => [],
                            ],
                        ],
                    ],
                ],
            ];
            $result = ContrastValidationService::validateDesignContrast($design);
            expect($result['violations'])->not->toBeEmpty()
                ->and($result['violations'][0]['backgroundColor'])->toBe('#000000');
        });

        it('uses global background when no local background', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#000000'],  // Dark global bg
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => ['color' => '#111111'],  // Dark text on dark bg — fails
                        'content' => [],
                    ],
                ],
            ];
            $result = ContrastValidationService::validateDesignContrast($design);
            expect($result['violations'])->not->toBeEmpty()
                ->and($result['violations'][0]['backgroundColor'])->toBe('#000000');
        });

        it('calculates pass rate correctly', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => [
                            'color' => '#000000',  // Passes
                        ],
                        'content' => [
                            'titleColor' => '#dddddd',  // Fails
                        ],
                    ],
                ],
            ];
            $result = ContrastValidationService::validateDesignContrast($design);
            // 1 pass, 1 fail → passRate = 0.5
            expect($result['passRate'])->toEqualWithDelta(0.5, 0.001);
        });

        it('ignores invalid hex colors', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => ['color' => 'not-a-color'],
                        'content' => [],
                    ],
                ],
            ];
            $result = ContrastValidationService::validateDesignContrast($design);
            expect($result['valid'])->toBeTrue()
                ->and($result['violations'])->toBeEmpty();
        });

        it('returns valid=true for empty widgets', function () {
            $design = ['globalStyles' => [], 'widgets' => []];
            $result = ContrastValidationService::validateDesignContrast($design);
            expect($result['valid'])->toBeTrue()
                ->and($result['passRate'])->toEqualWithDelta(1.0, 0.001);
        });

    });

    describe('autoFixContrast', function () {

        it('replaces failing text color in styles', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => ['color' => '#dddddd'],  // Light gray on white — fails
                        'content' => [],
                    ],
                ],
            ];
            $fixed = ContrastValidationService::autoFixContrast($design);
            // On light background, should fix to dark color
            expect($fixed['widgets'][0]['styles']['color'])->toBe('#1a1a1a');
        });

        it('replaces failing text color in content', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => [],
                        'content' => ['color' => '#dddddd'],  // Fails in content
                    ],
                ],
            ];
            $fixed = ContrastValidationService::autoFixContrast($design);
            expect($fixed['widgets'][0]['content']['color'])->toBe('#1a1a1a');
        });

        it('suggests white for text on dark background', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#000000'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => ['color' => '#111111'],  // Dark text on dark bg — fails
                        'content' => [],
                    ],
                ],
            ];
            $fixed = ContrastValidationService::autoFixContrast($design);
            // On dark background, should fix to white
            expect($fixed['widgets'][0]['styles']['color'])->toBe('#ffffff');
        });

        it('returns design unchanged when no violations', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => ['color' => '#000000'],
                        'content' => [],
                    ],
                ],
            ];
            $fixed = ContrastValidationService::autoFixContrast($design);
            expect($fixed['widgets'][0]['styles']['color'])->toBe('#000000');
        });

        it('fixes colors in nested widgets', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'column',
                        'styles' => [],
                        'content' => [],
                        'children' => [
                            [
                                'id' => 'widget_2',
                                'type' => 'text',
                                'styles' => ['color' => '#dddddd'],  // Fails
                                'content' => [],
                            ],
                        ],
                    ],
                ],
            ];
            $fixed = ContrastValidationService::autoFixContrast($design);
            expect($fixed['widgets'][0]['children'][0]['styles']['color'])->toBe('#1a1a1a');
        });

    });

    describe('isValidHexColor (via validateDesignContrast behavior)', function () {

        it('accepts 3-char hex (#abc)', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#fff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => ['color' => '#000'],
                        'content' => [],
                    ],
                ],
            ];
            // Should not throw and should validate the shorthand colors
            $result = ContrastValidationService::validateDesignContrast($design);
            expect($result)->toBeArray();
        });

        it('accepts 6-char hex (#aabbcc)', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => ['color' => '#000000'],
                        'content' => [],
                    ],
                ],
            ];
            $result = ContrastValidationService::validateDesignContrast($design);
            expect($result['valid'])->toBeTrue();
        });

        it('ignores rgb() strings', function () {
            $design = [
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    [
                        'id' => 'widget_1',
                        'type' => 'text',
                        'styles' => ['color' => 'rgb(0, 0, 0)'],
                        'content' => [],
                    ],
                ],
            ];
            $result = ContrastValidationService::validateDesignContrast($design);
            expect($result['valid'])->toBeTrue()
                ->and($result['violations'])->toBeEmpty();
        });

    });

});

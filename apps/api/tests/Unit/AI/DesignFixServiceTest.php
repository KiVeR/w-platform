<?php

declare(strict_types=1);

use App\Services\AI\DesignFixService;

describe('DesignFixService', function () {

    describe('parseDesignResponse', function () {

        it('parses raw JSON without fences', function () {
            $raw = '{"version": "1.0", "widgets": []}';
            $result = DesignFixService::parseDesignResponse($raw);
            expect($result)->toBeArray()
                ->and($result['version'])->toBe('1.0');
        });

        it('strips markdown json fences', function () {
            $raw = "```json\n{\"version\": \"1.0\", \"widgets\": []}\n```";
            $result = DesignFixService::parseDesignResponse($raw);
            expect($result)->toBeArray()
                ->and($result['version'])->toBe('1.0');
        });

        it('strips plain markdown fences', function () {
            $raw = "```\n{\"version\": \"2.0\"}\n```";
            $result = DesignFixService::parseDesignResponse($raw);
            expect($result)->toBeArray()
                ->and($result['version'])->toBe('2.0');
        });

        it('finds outermost braces with surrounding text', function () {
            $raw = 'Some text before {"version": "1.0"} and after';
            $result = DesignFixService::parseDesignResponse($raw);
            expect($result)->toBeArray()
                ->and($result['version'])->toBe('1.0');
        });

        it('returns null for invalid JSON', function () {
            $raw = '{not valid json}';
            $result = DesignFixService::parseDesignResponse($raw);
            expect($result)->toBeNull();
        });

        it('returns null when no JSON object found', function () {
            $raw = 'No JSON here at all';
            $result = DesignFixService::parseDesignResponse($raw);
            expect($result)->toBeNull();
        });

        it('handles empty string', function () {
            $result = DesignFixService::parseDesignResponse('');
            expect($result)->toBeNull();
        });

    });

    describe('fixParentChildConstraints', function () {

        it('flattens column inside column', function () {
            $widgets = [
                [
                    'type' => 'column',
                    'children' => [
                        ['type' => 'text'],
                    ],
                ],
            ];
            // Parent is column, so a column child should be flattened
            $result = DesignFixService::fixParentChildConstraints($widgets, 'column');
            // The column widget should be replaced by its children
            expect($result)->toHaveCount(1)
                ->and($result[0]['type'])->toBe('text');
        });

        it('flattens row inside column', function () {
            $widgets = [
                [
                    'type' => 'row',
                    'children' => [
                        ['type' => 'text'],
                        ['type' => 'image'],
                    ],
                ],
            ];
            $result = DesignFixService::fixParentChildConstraints($widgets, 'column');
            // Row inside column → flatten: replace row with its children
            expect($result)->toHaveCount(2)
                ->and($result[0]['type'])->toBe('text')
                ->and($result[1]['type'])->toBe('image');
        });

        it('wraps non-column child inside row', function () {
            $widgets = [
                ['type' => 'text'],
            ];
            $result = DesignFixService::fixParentChildConstraints($widgets, 'row');
            // Non-column inside row → wrap in column
            expect($result)->toHaveCount(1)
                ->and($result[0]['type'])->toBe('column');
            // Original text widget should be nested inside the column's children
            expect($result[0]['children'])->toHaveCount(1)
                ->and($result[0]['children'][0]['type'])->toBe('text');
        });

        it('leaves column child in row unchanged', function () {
            $widgets = [
                ['type' => 'column', 'children' => []],
            ];
            $result = DesignFixService::fixParentChildConstraints($widgets, 'row');
            expect($result)->toHaveCount(1)
                ->and($result[0]['type'])->toBe('column');
        });

        it('processes top-level widgets without parent constraints', function () {
            $widgets = [
                ['type' => 'row', 'children' => []],
                ['type' => 'column', 'children' => []],
                ['type' => 'text'],
            ];
            $result = DesignFixService::fixParentChildConstraints($widgets);
            expect($result)->toHaveCount(3);
        });

    });

    describe('fixWidgetIdsAndOrder', function () {

        it('assigns unique IDs to widgets', function () {
            $widgets = [
                ['type' => 'text'],
                ['type' => 'image'],
            ];
            $result = DesignFixService::fixWidgetIdsAndOrder($widgets);
            expect($result[0]['id'])->toStartWith('widget_')
                ->and($result[1]['id'])->toStartWith('widget_')
                ->and($result[0]['id'])->not->toBe($result[1]['id']);
        });

        it('sets order equal to array index', function () {
            $widgets = [
                ['type' => 'text'],
                ['type' => 'image'],
                ['type' => 'button'],
            ];
            $result = DesignFixService::fixWidgetIdsAndOrder($widgets);
            expect($result[0]['order'])->toBe(0)
                ->and($result[1]['order'])->toBe(1)
                ->and($result[2]['order'])->toBe(2);
        });

        it('ensures content array exists', function () {
            $widgets = [['type' => 'text']];
            $result = DesignFixService::fixWidgetIdsAndOrder($widgets);
            expect($result[0]['content'])->toBeArray();
        });

        it('ensures styles array exists', function () {
            $widgets = [['type' => 'text']];
            $result = DesignFixService::fixWidgetIdsAndOrder($widgets);
            expect($result[0]['styles'])->toBeArray();
        });

        it('recurses into children', function () {
            $widgets = [
                [
                    'type' => 'column',
                    'children' => [
                        ['type' => 'text'],
                    ],
                ],
            ];
            $result = DesignFixService::fixWidgetIdsAndOrder($widgets);
            expect($result[0]['children'][0]['id'])->toStartWith('widget_')
                ->and($result[0]['children'][0]['order'])->toBe(0);
        });

    });

    describe('ensureFormSubmitButton', function () {

        it('adds submit button to form without button', function () {
            $widgets = [
                [
                    'type' => 'form',
                    'children' => [
                        ['type' => 'input'],
                    ],
                ],
            ];
            $result = DesignFixService::ensureFormSubmitButton($widgets);
            $formChildren = $result[0]['children'];
            $lastChild = end($formChildren);
            expect($lastChild['type'])->toBe('button')
                ->and($lastChild['content']['text'])->toBe('Envoyer');
        });

        it('does not add button if form already ends with button', function () {
            $widgets = [
                [
                    'type' => 'form',
                    'children' => [
                        ['type' => 'input'],
                        ['type' => 'button', 'content' => ['text' => 'Submit']],
                    ],
                ],
            ];
            $result = DesignFixService::ensureFormSubmitButton($widgets);
            expect($result[0]['children'])->toHaveCount(2);
        });

        it('adds button to empty form', function () {
            $widgets = [
                [
                    'type' => 'form',
                    'children' => [],
                ],
            ];
            $result = DesignFixService::ensureFormSubmitButton($widgets);
            expect($result[0]['children'])->toHaveCount(1)
                ->and($result[0]['children'][0]['type'])->toBe('button');
        });

        it('does not affect non-form widgets', function () {
            $widgets = [
                ['type' => 'text'],
                ['type' => 'image'],
            ];
            $result = DesignFixService::ensureFormSubmitButton($widgets);
            expect($result)->toHaveCount(2)
                ->and($result[0]['type'])->toBe('text');
        });

        it('recurses into nested non-form widgets', function () {
            $widgets = [
                [
                    'type' => 'column',
                    'children' => [
                        [
                            'type' => 'form',
                            'children' => [['type' => 'input']],
                        ],
                    ],
                ],
            ];
            $result = DesignFixService::ensureFormSubmitButton($widgets);
            $nestedForm = $result[0]['children'][0];
            $lastChild = end($nestedForm['children']);
            expect($lastChild['type'])->toBe('button');
        });

    });

    describe('applyAllFixes', function () {

        it('adds version if missing', function () {
            $design = ['widgets' => []];
            $result = DesignFixService::applyAllFixes($design);
            expect($result['version'])->toBe('1.0');
        });

        it('preserves existing version', function () {
            $design = ['version' => '2.0', 'widgets' => []];
            $result = DesignFixService::applyAllFixes($design);
            expect($result['version'])->toBe('2.0');
        });

        it('adds globalStyles with white background if missing', function () {
            $design = ['widgets' => []];
            $result = DesignFixService::applyAllFixes($design);
            expect($result['globalStyles'])->toBeArray()
                ->and($result['globalStyles']['backgroundColor'])->toBe('#ffffff');
        });

        it('adds widgets array if missing', function () {
            $design = [];
            $result = DesignFixService::applyAllFixes($design);
            expect($result['widgets'])->toBeArray();
        });

        it('applies full pipeline: constraints + form button + IDs', function () {
            $design = [
                'widgets' => [
                    [
                        'type' => 'form',
                        'children' => [
                            ['type' => 'input'],
                        ],
                    ],
                ],
            ];
            $result = DesignFixService::applyAllFixes($design);
            $form = $result['widgets'][0];

            // Form should have a submit button appended
            $lastChild = end($form['children']);
            expect($lastChild['type'])->toBe('button');

            // All widgets should have unique IDs
            expect($form['id'])->toStartWith('widget_');
            expect($form['children'][0]['id'])->toStartWith('widget_');
        });

    });

});

<?php

declare(strict_types=1);

namespace App\Http\Requests\AIContent;

use Illuminate\Foundation\Http\FormRequest;

class SaveDesignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'design' => ['required', 'array'],
            'design.version' => ['sometimes', 'string', 'max:20'],
            'design.globalStyles' => ['sometimes', 'array'],
            'design.widgets' => ['sometimes', 'array', 'max:500'],
        ];
    }

    public function withValidator(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Contracts\Validation\Validator $validator): void {
            $design = $this->input('design');

            if (! is_array($design)) {
                return;
            }

            // Max payload ~5MB check
            $payload = json_encode($design);
            if ($payload !== false && strlen($payload) > 5 * 1024 * 1024) {
                $validator->errors()->add('design', 'Le design ne peut pas dépasser 5 Mo.');

                return;
            }

            $widgets = $design['widgets'] ?? [];

            if (! is_array($widgets)) {
                return;
            }

            // Max 500 widgets total
            if (count($widgets) > 500) {
                $validator->errors()->add('design.widgets', 'Le design ne peut pas contenir plus de 500 widgets.');

                return;
            }

            // Widget IDs uniqueness and structural checks
            $ids = [];
            foreach ($widgets as $widget) {
                if (! is_array($widget)) {
                    continue;
                }

                $id = $widget['id'] ?? null;
                if ($id !== null) {
                    if (in_array($id, $ids, true)) {
                        $validator->errors()->add('design.widgets', "Widget ID dupliqué : {$id}.");

                        return;
                    }
                    $ids[] = $id;
                }

                // Max 50 children per widget
                $children = $widget['children'] ?? [];
                if (is_array($children) && count($children) > 50) {
                    $validator->errors()->add('design.widgets', 'Un widget ne peut pas avoir plus de 50 enfants.');

                    return;
                }

                // Parent-child constraints
                $type = $widget['type'] ?? null;
                if (is_array($children) && count($children) > 0) {
                    foreach ($children as $child) {
                        if (! is_array($child)) {
                            continue;
                        }
                        $childType = $child['type'] ?? null;
                        // column widgets cannot contain row or column
                        if ($type === 'column' && in_array($childType, ['row', 'column'], true)) {
                            $validator->errors()->add('design.widgets', 'Un widget column ne peut pas contenir de widget row ou column.');

                            return;
                        }
                        // form widgets cannot contain nested forms
                        if ($type === 'form' && $childType === 'form') {
                            $validator->errors()->add('design.widgets', 'Un widget form ne peut pas contenir de widget form imbriqué.');

                            return;
                        }
                    }
                }
            }
        });
    }
}

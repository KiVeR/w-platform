<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Services\StateMachine\TransitionMap;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class TransitionOperationRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'track' => ['required', 'string', Rule::in(TransitionMap::VALID_TRACKS)],
            'to_state' => ['required', 'string'],
            'reason' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $track = $this->input('track');
            $toStateValue = $this->input('to_state');

            if (! is_string($track) || ! is_string($toStateValue)) {
                return;
            }

            if (! in_array($track, TransitionMap::VALID_TRACKS, true)) {
                return;
            }

            try {
                $toState = TransitionMap::resolveEnum($track, $toStateValue);
            } catch (InvalidArgumentException) {
                $validator->errors()->add('to_state', "Invalid state '{$toStateValue}' for track '{$track}'.");

                return;
            }

            /** @var \App\Models\Operation|null $operation */
            $operation = $this->route('operation');

            if ($operation === null) {
                return;
            }

            $currentState = TransitionMap::getCurrentState($operation, $track);

            if (! TransitionMap::isValid($track, $currentState, $toState)) {
                $validator->errors()->add(
                    'to_state',
                    "Cannot transition from '{$currentState->value}' to '{$toState->value}' on track '{$track}'."
                );
            }
        });
    }
}

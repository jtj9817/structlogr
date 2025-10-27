<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HistorySearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('query')) {
            $this->merge([
                'query' => trim((string) $this->input('query')),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'min:2', 'max:100'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'scope' => [
                'sometimes',
                'string',
                Rule::in(['all', 'recent', 'saved']),
            ],
        ];
    }
}

<?php

namespace App\Services;

use App\Models\FormattedLog;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class HistoryService
{
    private const DEFAULT_LIMIT = 20;
    private const MAX_LIMIT = 50;

    public function entriesForUser(User $user, int $limit = 50): Collection
    {
        return FormattedLog::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function payloadForUser(User $user, int $limit = 50): array
    {
        $entries = $this->entriesForUser($user, $limit);

        $transform = fn (FormattedLog $entry) => [
            'id' => $entry->id,
            'summary' => $entry->summary,
            'title' => $entry->title,
            'preview' => $this->makePreview($entry->raw_log),
            'createdAt' => optional($entry->created_at)->toIso8601String(),
            'detectedLogType' => $entry->detected_log_type,
            'fieldCount' => $entry->field_count,
            'isSaved' => (bool) $entry->is_saved,
        ];

        return [
            'recent' => $entries
                ->filter(fn (FormattedLog $entry) => ! $entry->is_saved)
                ->values()
                ->map($transform)
                ->all(),
            'saved' => $entries
                ->filter(fn (FormattedLog $entry) => $entry->is_saved)
                ->values()
                ->map($transform)
                ->all(),
        ];
    }

    public function search(User $user, string $query, string $scope = 'all', int $limit = self::DEFAULT_LIMIT): array
    {
        $normalizedScope = in_array($scope, ['recent', 'saved'], true) ? $scope : 'all';
        $normalizedLimit = (int) max(1, min($limit, self::MAX_LIMIT));

        $entries = $this->searchEntries($user, $query, $normalizedScope, $normalizedLimit);

        $results = $entries
            ->map(fn (FormattedLog $entry) => [
                'id' => $entry->id,
                'title' => $entry->title,
                'summary' => $entry->summary,
                'preview' => $this->makePreview($entry->raw_log),
                'detectedLogType' => $entry->detected_log_type,
                'createdAt' => optional($entry->created_at)->toIso8601String(),
                'fieldCount' => $entry->field_count,
                'isSaved' => (bool) $entry->is_saved,
                'collection' => $entry->is_saved ? 'saved' : 'recent',
            ])
            ->all();

        return [
            'query' => $query,
            'results' => $results,
            'meta' => [
                'limit' => $normalizedLimit,
                'count' => count($results),
                'scope' => $normalizedScope,
            ],
        ];
    }

    private function searchEntries(User $user, string $query, string $scope, int $limit): Collection
    {
        $likeTerm = '%'.$query.'%';

        return FormattedLog::query()
            ->forUser($user->id)
            ->when($scope === 'saved', fn ($builder) => $builder->where('is_saved', true))
            ->when($scope === 'recent', fn ($builder) => $builder->where('is_saved', false))
            ->where(function ($builder) use ($likeTerm) {
                $builder
                    ->where('title', 'like', $likeTerm)
                    ->orWhere('summary', 'like', $likeTerm)
                    ->orWhere('detected_log_type', 'like', $likeTerm)
                    ->orWhere('raw_log', 'like', $likeTerm);
            })
            ->latest()
            ->limit($limit)
            ->get();
    }

    private function makePreview(?string $rawLog): string
    {
        return Str::of($rawLog ?? '')
            ->replace(["\r\n", "\r", "\n"], ' ')
            ->squish()
            ->limit(120)
            ->toString();
    }
}

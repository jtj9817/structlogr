<?php

namespace App\Services;

use App\Models\FormattedLog;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class HistoryService
{
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
            'preview' => Str::of($entry->raw_log ?? '')
                ->replace(["\r\n", "\r", "\n"], ' ')
                ->squish()
                ->limit(120)
                ->toString(),
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
}

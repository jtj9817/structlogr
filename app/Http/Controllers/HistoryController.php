<?php

namespace App\Http\Controllers;

use App\Models\FormattedLog;
use App\Services\HistoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HistoryController extends Controller
{
    public function __construct(private HistoryService $historyService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => $this->historyService->payloadForUser($user),
        ]);
    }

    public function show(Request $request, FormattedLog $formattedLog): JsonResponse
    {
        $this->authorizeEntry($request, $formattedLog);

        return response()->json([
            'data' => [
                'id' => $formattedLog->id,
                'raw_log' => $formattedLog->raw_log,
                'formatted_log' => $formattedLog->formatted_log,
            ],
        ]);
    }

    public function destroy(Request $request, FormattedLog $formattedLog): JsonResponse
    {
        $this->authorizeEntry($request, $formattedLog);
        $formattedLog->delete();

        return $this->historyResponse($request);
    }

    public function toggleSave(Request $request, FormattedLog $formattedLog): JsonResponse
    {
        $this->authorizeEntry($request, $formattedLog);
        $formattedLog->forceFill([
            'is_saved' => ! $formattedLog->is_saved,
        ])->save();

        return $this->historyResponse($request);
    }

    public function clear(Request $request): JsonResponse
    {
        $user = $request->user();

        FormattedLog::query()
            ->where('user_id', $user->id)
            ->delete();

        return $this->historyResponse($request);
    }

    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $entries = $this->historyService
            ->entriesForUser($user, 1000)
            ->map(fn (FormattedLog $entry) => [
                'id' => $entry->id,
                'summary' => $entry->summary,
                'rawLog' => $entry->raw_log,
                'formattedLog' => $entry->formatted_log,
                'detectedLogType' => $entry->detected_log_type,
                'fieldCount' => $entry->field_count,
                'isSaved' => (bool) $entry->is_saved,
                'createdAt' => optional($entry->created_at)->toIso8601String(),
            ]);

        $filename = 'structlogr-history-'.$user->id.'-'.now()->format('Ymd_His').'.json';

        return response()->streamDownload(
            function () use ($entries) {
                echo (string) json_encode($entries->toArray(), JSON_PRETTY_PRINT);
            },
            $filename,
            [
                'Content-Type' => 'application/json',
            ]
        );
    }

    protected function historyResponse(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->historyService->payloadForUser($request->user()),
        ]);
    }

    protected function authorizeEntry(Request $request, FormattedLog $formattedLog): void
    {
        abort_unless(
            $formattedLog->user_id === $request->user()?->id,
            404,
        );
    }
}

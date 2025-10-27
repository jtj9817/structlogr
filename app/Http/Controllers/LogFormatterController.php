<?php

namespace App\Http\Controllers;

use App\Services\HistoryService;
use App\Services\LogFormatterService;
use Illuminate\Http\Request;

class LogFormatterController extends Controller
{
    public function __construct(private HistoryService $historyService) {}

    public function show(Request $request)
    {
        return inertia('FormatterPage', [
            'formattedLog' => session('formattedLog'),
            'success' => session('success'),
            'history' => $this->historyPayload($request),
            'historyRoutes' => $this->historyRoutes(),
        ]);
    }

    public function format(Request $request, LogFormatterService $logFormatterService)
    {
        $validated = $request->validate([
            'raw_log' => 'required|string',
            'llm_model' => 'nullable|string|in:deepseek-chat,gemini-2.5-flash,kimi-k2-turbo-preview,GLM-4.5-Air,GLM-4.6',
            'preferences' => 'nullable|array',
            'preferences.includeMetadata' => 'nullable|boolean',
            'preferences.parseTimestamps' => 'nullable|boolean',
            'preferences.normalizeLogLevels' => 'nullable|boolean',
            'preferences.timezone' => 'nullable|string|in:UTC,Local',
            'preferences.dateFormat' => 'nullable|string|in:ISO8601,Unix,Custom',
        ]);

        $rawLog = $validated['raw_log'];
        $llmModel = $validated['llm_model'] ?? 'deepseek-chat';
        $preferences = $validated['preferences'] ?? null;

        try {
            $result = $logFormatterService->format($rawLog, $llmModel, $preferences);
            $logFormatterService->saveLog($rawLog, $result['structured'], $result['title'], $request->user());

            return redirect()
                ->route('home')
                ->with('formattedLog', $result['structured'])
                ->with('success', 'Log formatted successfully!');
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors([
                'llm_model' => 'Invalid LLM model selected. Please choose a supported model.',
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'raw_log' => 'Failed to format log. Please try again or select a different model.',
            ]);
        }
    }

    protected function historyPayload(Request $request): ?array
    {
        if (! $request->user()) {
            return null;
        }

        return $this->historyService->payloadForUser($request->user());
    }

    protected function historyRoutes(): ?array
    {
        if (! auth()->check()) {
            return null;
        }

        $base = route('history.index');

        return [
            'index' => $base,
            'detail' => $base.'/:id',
            'toggle' => $base.'/:id/toggle-save',
            'clear' => route('history.clear'),
            'export' => route('history.export'),
            'search' => route('history.search'),
        ];
    }
}

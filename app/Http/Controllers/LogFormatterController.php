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
            'history' => $this->historyPayload($request),
            'historyRoutes' => $this->historyRoutes(),
        ]);
    }

    public function format(Request $request, LogFormatterService $logFormatterService)
    {
        $validated = $request->validate([
            'raw_log' => 'required|string',
            'llm_model' => 'nullable|string|in:deepseek-chat,kimi-k2-turbo-preview,GLM-4.5-Air,GLM-4.6',
        ]);

        $rawLog = $validated['raw_log'];
        $llmModel = $validated['llm_model'] ?? 'deepseek-chat';

        try {
            $formattedLog = $logFormatterService->format($rawLog, $llmModel);
            $logFormatterService->saveLog($rawLog, $formattedLog, $request->user());

            return inertia('FormatterPage', [
                'formattedLog' => $formattedLog,
                'success' => 'Log formatted successfully!',
                'history' => $this->historyPayload($request),
                'historyRoutes' => $this->historyRoutes(),
            ]);
        } catch (\InvalidArgumentException $e) {
            return inertia('FormatterPage', [
                'history' => $this->historyPayload($request),
                'historyRoutes' => $this->historyRoutes(),
            ])->withErrors([
                'llm_model' => 'Invalid LLM model selected. Please choose a supported model.',
            ]);
        } catch (\Exception $e) {
            return inertia('FormatterPage', [
                'history' => $this->historyPayload($request),
                'historyRoutes' => $this->historyRoutes(),
            ])->withErrors([
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
        ];
    }
}

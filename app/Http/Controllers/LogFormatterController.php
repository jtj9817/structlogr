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
        $request->validate([
            'raw_log' => 'required|string',
        ]);

        $rawLog = $request->input('raw_log');
        $formattedLog = $logFormatterService->format($rawLog);
        $logFormatterService->saveLog($rawLog, $formattedLog, $request->user());

        return inertia('FormatterPage', [
            'formattedLog' => $formattedLog,
            'success' => 'Log formatted successfully!',
            'history' => $this->historyPayload($request),
            'historyRoutes' => $this->historyRoutes(),
        ]);
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

<?php

namespace App\Http\Controllers;

use App\Services\LogFormatterService;
use Illuminate\Http\Request;

class LogFormatterController extends Controller
{
    public function show()
    {
        return inertia('FormatterPage');
    }

    public function format(Request $request, LogFormatterService $logFormatterService)
    {
        $request->validate([
            'raw_log' => 'required|string',
        ]);

        $rawLog = $request->input('raw_log');
        $formattedLog = $logFormatterService->format($rawLog);
        $savedLog = $logFormatterService->saveLog($rawLog, $formattedLog);

        return inertia('FormatterPage', [
            'formattedLog' => $formattedLog,
            'success' => 'Log formatted successfully!',
        ]);
    }
}

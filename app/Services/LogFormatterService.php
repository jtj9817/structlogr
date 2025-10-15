<?php

namespace App\Services;

use App\Models\FormattedLog;
use Prism\Prism;

class LogFormatterService
{
    public function format(string $rawLog): array
    {
        $systemPrompt = "You are an expert log analysis assistant. Your task is to reformat the given raw log text into a structured JSON object. Extract key information such as timestamp, log level, message, source, and any relevant metadata. Ensure the output is clean, well-structured, and follows standard log formatting conventions.";

        $result = prism()
            ->structured()
            ->agent($systemPrompt)
            ->generate($rawLog)
            ->toArray();

        return $result;
    }

    public function saveLog(string $rawLog, array $formattedLog): FormattedLog
    {
        return FormattedLog::create([
            'raw_log' => $rawLog,
            'formatted_log' => $formattedLog,
        ]);
    }
}
<?php

namespace App\Services;

use App\Models\FormattedLog;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Prism;
use Prism\Prism\Schema\ObjectSchema;
use Prism\Prism\Schema\StringSchema;

class LogFormatterService
{
    public function format(string $rawLog): array
    {
        $systemPrompt = "You are an expert log analysis assistant. Your task is to reformat the given raw log text into a structured JSON object. Extract key information such as timestamp, log level, message, source, and any relevant metadata. Ensure the output is clean, well-structured, and follows standard log formatting conventions.";

        $schema = new ObjectSchema(
            'formatted_log',
            'A structured log entry',
            [
                new StringSchema('timestamp', 'The timestamp of the log entry'),
                new StringSchema('level', 'The log level (e.g., INFO, ERROR, DEBUG)'),
                new StringSchema('message', 'The main log message'),
                new StringSchema('source', 'The source or origin of the log'),
                new StringSchema('metadata', 'Any additional metadata as JSON string'),
            ]
        );

        $response = Prism::structured()
            ->using(Provider::DeepSeek, 'deepseek-chat')
            ->withSystemPrompt($systemPrompt)
            ->withSchema($schema)
            ->withPrompt($rawLog)
            ->generate();

        return $response->structured;
    }

    public function saveLog(string $rawLog, array $formattedLog): FormattedLog
    {
        return FormattedLog::create([
            'raw_log' => $rawLog,
            'formatted_log' => $formattedLog,
        ]);
    }
}
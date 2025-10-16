<?php

namespace App\Services;

use App\Models\FormattedLog;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Prism;
use Prism\Prism\Schema\ArraySchema;
use Prism\Prism\Schema\NumberSchema;
use Prism\Prism\Schema\ObjectSchema;
use Prism\Prism\Schema\StringSchema;

class LogFormatterService
{
    public function format(string $rawLog): array
    {
        $systemPrompt = <<<'PROMPT'
You are StructLogr, an AI assistant that converts raw, multi-line log text into normalized JSON that helps developers debug quickly.

Rules you must follow:
1. Always return strictly valid JSON that conforms to the provided schema. Do not include Markdown, prose, or code fences.
2. Detect the dominant log category (e.g., application_error, test_runner, build_pipeline, http_access, database, security_event, system_metrics, general). Choose the closest match; if uncertain, use "general".
3. Build a concise summary capturing overall status, the primary subject, and key takeaways. When the log lacks data for a field, return null or an empty array as appropriate.
4. Capture important entities (tests, services, hosts, jobs, request IDs, etc.) exactly as they appear in the log.
5. Record quantitative metrics when counts, totals, or durations are mentioned. Omit a metric if no trustworthy value is present.
6. Populate sections with structured data tailored to the log content:
   - For test output, add section_type "test_results" with `data` containing `test_suite`, `summary` (failed/passed/skipped/total/assertions/duration/status), and arrays such as `failed_tests`, `errors`, `skipped_tests`, and any other relevant groups. Preserve stack traces, file paths, and durations.
   - For application errors or stack traces, prefer section_type "errors" or "exceptions" with per-item details (`error_class`, `message`, `stack_frames`, `context`).
   - For HTTP or access logs, use section_type "http_requests" summarizing method, status code, path, response time, and user agent.
   - For build or CI logs, use section_type "build_steps" with step names, status, duration, and logs.
   - For security or audit logs, use section_type "security_events" with actor, action, resource, and outcome.
   - Create multiple sections if the log includes mixed information.
7. `details` and `data` objects may include any additional fields (strings, numbers, arrays, nested objects) that make the output actionable. Preserve multi-line strings such as stack traces verbatim.
8. Never invent information that does not exist in the log. If uncertain, leave values null or omit optional entries instead of guessing.
PROMPT;

        $schema = new ObjectSchema(
            'formatted_log',
            'Normalized representation of a parsed log with contextual sections',
            [
                new StringSchema('detected_log_type', 'High-level category of the log such as application_error, test_runner, build_pipeline, http_access, database, security_event, system_metrics, or general'),
                new ObjectSchema(
                    'summary',
                    'High-level summary data describing the overall outcome of the log',
                    [
                        new StringSchema('status', 'Overall status or severity such as PASS, FAIL, ERROR, WARN, INFO'),
                        new StringSchema('headline', 'Single-sentence headline that captures the main insight from the log'),
                        new StringSchema('primary_subject', 'Primary subject entity (e.g., job name, test suite, service name)', true),
                        new ArraySchema(
                            'key_points',
                            'Ordered list of key findings or highlights extracted from the log',
                            new StringSchema('key_point', 'Key insight derived from the log'),
                            true
                        ),
                        new StringSchema('duration', 'Total runtime or duration expressed as it appears in the log', true),
                        new StringSchema('timestamp', 'Primary timestamp associated with the log', true),
                    ],
                    ['status', 'headline'],
                    true
                ),
                new ArraySchema(
                    'entities',
                    'Primary entities referenced in the log (tests, services, hosts, jobs, request IDs, etc.)',
                    new ObjectSchema(
                        'entity',
                        'Entity referenced within the log',
                        [
                            new StringSchema('type', 'Type of entity such as test_suite, test_case, service, host, job, request_id'),
                            new StringSchema('identifier', 'Identifier or name of the entity as it appears in the log'),
                            new StringSchema('details', 'Additional context about the entity', true),
                        ],
                        ['type', 'identifier'],
                        true
                    ),
                    true
                ),
                new ArraySchema(
                    'metrics',
                    'Quantitative metrics extracted from the log',
                    new ObjectSchema(
                        'metric',
                        'Single metric value extracted from the log',
                        [
                            new StringSchema('name', 'Metric name such as failed, passed, total, error_rate'),
                            new NumberSchema('value', 'Numeric value of the metric', true),
                            new StringSchema('unit', 'Unit of measurement if applicable (e.g., tests, seconds, ms)', true),
                            new StringSchema('description', 'Description of what this metric represents', true),
                        ],
                        ['name'],
                        true
                    ),
                    true
                ),
                new ArraySchema(
                    'sections',
                    'Structured sections containing detailed data extracted from the log',
                    new ObjectSchema(
                        'section',
                        'Structured section for a particular aspect of the log',
                        [
                            new StringSchema('section_type', 'Machine-friendly type identifier such as test_results, errors, exceptions, http_requests, build_steps, security_events'),
                            new StringSchema('title', 'Human-friendly title for this section', true),
                            new StringSchema('description', 'Short explanation of what this section contains', true),
                            new ArraySchema(
                                'items',
                                'Individual items captured in this section when applicable',
                                new ObjectSchema(
                                    'section_item',
                                    'Item within a section (structure may vary by section_type)',
                                    [
                                        new StringSchema('name', 'Primary identifier for the item', true),
                                        new StringSchema('status', 'Status or severity for the item, if applicable', true),
                                        new StringSchema('category', 'Category label for the item', true),
                                        new StringSchema('timestamp', 'Timestamp for the item if present', true),
                                        new StringSchema('duration', 'Duration associated with the item', true),
                                        new ObjectSchema(
                                            'details',
                                            'Additional key-value details for this item',
                                            [],
                                            [],
                                            true,
                                            true
                                        ),
                                    ],
                                    [],
                                    true,
                                    true
                                ),
                                true
                            ),
                            new ObjectSchema(
                                'data',
                                'Section-specific structured data such as summaries or tables',
                                [],
                                [],
                                true,
                                true
                            ),
                        ],
                        ['section_type'],
                        true,
                        true
                    )
                ),
            ],
            ['detected_log_type', 'summary', 'sections'],
            true
        );

        $response = Prism::structured()
            ->using(Provider::DeepSeek, 'deepseek-chat')
            ->withSystemPrompt($systemPrompt)
            ->withSchema($schema)
            ->withPrompt($rawLog)
            ->withClientOptions([
                'timeout' => config('services.http.timeout', 600),
                'connect_timeout' => config('services.http.connect_timeout', 60),
            ])
            ->asStructured();
        // ->generate();

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

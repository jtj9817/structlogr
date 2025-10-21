<?php

namespace App\Services;

use App\Models\FormattedLog;
use App\Models\User;
use Illuminate\Support\Str;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Prism;
use Prism\Prism\Schema\ArraySchema;
use Prism\Prism\Schema\NumberSchema;
use Prism\Prism\Schema\ObjectSchema;
use Prism\Prism\Schema\StringSchema;

class LogFormatterService
{
    public function format(string $rawLog, ?string $llmModel = null): array
    {
        $llmModel = $llmModel ?? 'deepseek-chat';
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
                                        new ArraySchema(
                                            'details',
                                            'Additional key-value details for this item represented as labeled entries',
                                            new ObjectSchema(
                                                'detail_entry',
                                                'Describes a single key/value detail captured for the item',
                                                [
                                                    new StringSchema('key', 'Name of the detail field or attribute'),
                                                    new StringSchema('value', 'String representation of the field value', true),
                                                    new NumberSchema('value_number', 'Numeric representation of the value when applicable', true),
                                                    new ArraySchema(
                                                        'value_list',
                                                        'List representation when the value contains multiple items',
                                                        new StringSchema('value_item', 'Individual value contained in the list'),
                                                        true
                                                    ),
                                                ],
                                                ['key'],
                                                true
                                            ),
                                            true
                                        ),
                                    ],
                                    [],
                                    true,
                                    true
                                ),
                                true
                            ),
                            new ArraySchema(
                                'data',
                                'Section-specific structured data entries (key/value groups or nested items)',
                                new ObjectSchema(
                                    'data_entry',
                                    'Structured data entry associated with the section',
                                    [
                                        new StringSchema('key', 'Identifier or label for this data entry'),
                                        new StringSchema('value', 'String representation of the entry value', true),
                                        new NumberSchema('value_number', 'Numeric representation when available', true),
                                        new ArraySchema(
                                            'items',
                                            'Optional nested items that break down this data entry further',
                                            new ObjectSchema(
                                                'data_item',
                                                'Nested item contained within a section data entry',
                                                [
                                                    new StringSchema('key', 'Key or label for the nested item', true),
                                                    new StringSchema('value', 'String value for the nested item', true),
                                                    new NumberSchema('value_number', 'Numeric value when applicable', true),
                                                ],
                                                [],
                                                true,
                                                true
                                            ),
                                            true
                                        ),
                                    ],
                                    ['key'],
                                    true
                                ),
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

        $prismBuilder = Prism::structured();

        match ($llmModel) {
            'deepseek-chat' => $prismBuilder->using(Provider::DeepSeek, 'deepseek-chat'),
            'kimi-k2-turbo-preview' => $prismBuilder->using(Provider::OpenRouter, 'moonshot/kimi-k2-turbo-preview'),
            'GLM-4.5-Air' => $prismBuilder->using(Provider::OpenRouter, 'zhipuai/glm-4.5-air'),
            'GLM-4.6' => $prismBuilder->using(Provider::OpenRouter, 'zhipuai/glm-4.6'),
            default => throw new \InvalidArgumentException("Unsupported LLM model: {$llmModel}"),
        };

        $response = $prismBuilder
            ->withSystemPrompt($systemPrompt)
            ->withSchema($schema)
            ->withPrompt($rawLog)
            ->withClientOptions([
                'timeout' => config('services.http.timeout', 600),
                'connect_timeout' => config('services.http.connect_timeout', 60),
            ])
            ->asStructured();

        return $response->structured;
    }

    public function saveLog(string $rawLog, array $formattedLog, ?User $user = null): ?FormattedLog
    {
        if (! $user) {
            return null;
        }

        $summary = data_get($formattedLog, 'summary.headline');
        $detectedType = data_get($formattedLog, 'detected_log_type');
        $fieldCount = is_array($formattedLog) ? count($formattedLog) : 0;

        return FormattedLog::create([
            'user_id' => $user->id,
            'raw_log' => $rawLog,
            'formatted_log' => $formattedLog,
            'summary' => $summary ? Str::limit($summary, 255) : Str::limit(trim($rawLog), 255),
            'detected_log_type' => $detectedType,
            'field_count' => $fieldCount,
        ]);
    }
}

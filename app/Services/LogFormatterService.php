<?php

namespace App\Services;

use App\Models\FormattedLog;
use App\Models\User;
use Illuminate\Support\Str;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Exceptions\PrismException;
use Prism\Prism\Prism;
use Prism\Prism\Schema\ArraySchema;
use Prism\Prism\Schema\EnumSchema;
use Prism\Prism\Schema\NumberSchema;
use Prism\Prism\Schema\ObjectSchema;
use Prism\Prism\Schema\StringSchema;

class LogFormatterService
{
    public function format(string $rawLog, ?string $llmModel = null, ?array $preferences = null, int $maxRetries = 3): array
    {
        $llmModel = $llmModel ?? 'deepseek-chat';
        $attempt = 0;

        \Log::info('=== LogFormatterService::format() START ===', [
            'llm_model' => $llmModel,
            'preferences' => $preferences,
            'max_retries' => $maxRetries,
            'raw_log_length' => strlen($rawLog),
            'raw_log_preview' => substr($rawLog, 0, 200),
        ]);

        while ($attempt < $maxRetries) {
            try {
                \Log::info("Attempt {$attempt}/{$maxRetries} starting", [
                    'attempt' => $attempt,
                    'model' => $llmModel,
                ]);

                $schema = $this->getSchema();
                \Log::debug('Schema generated', ['schema_name' => $schema->name]);

                $systemPrompt = $this->getSystemPrompt($llmModel);
                \Log::debug('System prompt generated', [
                    'model' => $llmModel,
                    'prompt_length' => strlen($systemPrompt),
                ]);

                $prismBuilder = Prism::structured();
                \Log::debug('Prism builder initialized');

                \Log::info('Configuring LLM provider', ['model' => $llmModel]);

                match ($llmModel) {
                    'deepseek-chat' => $this->configureDeepseek($prismBuilder),
                    'gemini-2.5-flash' => $this->configureGemini($prismBuilder, $schema),
                    'kimi-k2-turbo-preview' => $this->configureMoonshot($prismBuilder, $schema),
                    'GLM-4.5-Air' => $this->configureGLM($prismBuilder, $schema, 'z-ai/glm-4.5-air'),
                    'GLM-4.6' => $this->configureGLM($prismBuilder, $schema, 'z-ai/glm-4.6'),
                    default => throw new \InvalidArgumentException("Unsupported LLM model: {$llmModel}"),
                };

                \Log::info('LLM provider configured successfully', ['model' => $llmModel]);

                \Log::info('Sending request to LLM API', [
                    'model' => $llmModel,
                    'temperature' => 0.0,
                    'max_tokens' => 8192,
                    'timeout' => config('services.http.timeout', 600),
                    'connect_timeout' => config('services.http.connect_timeout', 60),
                ]);

                $startTime = microtime(true);

                $response = $prismBuilder
                    ->withSystemPrompt($systemPrompt)
                    ->withSchema($schema)
                    ->withPrompt($rawLog)
                    ->usingTemperature(0.0)
                    ->withMaxTokens(8192)
                    ->withClientOptions([
                        'timeout' => config('services.http.timeout', 600),
                        'connect_timeout' => config('services.http.connect_timeout', 60),
                    ])
                    ->asStructured();

                $duration = round((microtime(true) - $startTime) * 1000, 2);
                \Log::info('LLM API response received', [
                    'model' => $llmModel,
                    'duration_ms' => $duration,
                ]);

                $structured = $response->structured;

                \Log::debug('Structured output extracted', [
                    'has_data' => !empty($structured),
                    'keys' => !empty($structured) ? array_keys($structured) : [],
                ]);

                if (empty($structured)) {
                    \Log::error('Empty response from API', ['model' => $llmModel]);
                    throw new \Exception('Empty response from API');
                }

                \Log::info('Validating structured output');
                $this->validateStructuredOutput($structured);
                \Log::info('Structured output validated successfully');

                if ($preferences) {
                    \Log::info('Applying preferences to formatted log', ['preferences' => $preferences]);
                    $structured = $this->applyPreferences($structured, $preferences);
                    \Log::debug('Preferences applied successfully');
                }

                \Log::info('=== LogFormatterService::format() SUCCESS ===', [
                    'model' => $llmModel,
                    'attempt' => $attempt,
                    'detected_log_type' => $structured['detected_log_type'] ?? 'unknown',
                    'sections_count' => count($structured['sections'] ?? []),
                ]);

                return $structured;

            } catch (PrismException $e) {
                $attempt++;
                \Log::warning("[PrismException] Structured output attempt {$attempt} failed", [
                    'model' => $llmModel,
                    'error' => $e->getMessage(),
                    'code' => $e->getCode(),
                    'attempt' => $attempt,
                    'max_retries' => $maxRetries,
                ]);

                if ($attempt >= $maxRetries) {
                    \Log::error('=== LogFormatterService::format() FAILED (Max retries exceeded) ===', [
                        'model' => $llmModel,
                        'attempts' => $attempt,
                        'error' => $e->getMessage(),
                    ]);
                    throw new \Exception(
                        "Failed to format log after {$maxRetries} attempts: ".$e->getMessage(),
                        $e->getCode(),
                        $e
                    );
                }

                $backoffSeconds = pow(2, $attempt);
                \Log::info("Retrying after backoff", ['backoff_seconds' => $backoffSeconds]);
                sleep($backoffSeconds);

            } catch (\Exception $e) {
                $attempt++;
                \Log::warning("[Exception] Structured output attempt {$attempt} failed", [
                    'model' => $llmModel,
                    'error' => $e->getMessage(),
                    'exception_type' => get_class($e),
                    'attempt' => $attempt,
                    'max_retries' => $maxRetries,
                ]);

                if ($attempt >= $maxRetries) {
                    \Log::error('=== LogFormatterService::format() FAILED (Max retries exceeded) ===', [
                        'model' => $llmModel,
                        'attempts' => $attempt,
                        'error' => $e->getMessage(),
                    ]);
                    throw $e;
                }

                $backoffSeconds = pow(2, $attempt);
                \Log::info("Retrying after backoff", ['backoff_seconds' => $backoffSeconds]);
                sleep($backoffSeconds);
            }
        }

        \Log::critical('=== LogFormatterService::format() CRITICAL: Exceeded retry loop ===', [
            'model' => $llmModel,
            'attempts' => $attempt,
        ]);
        throw new \Exception('Unexpected error: exceeded retry loop');
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

    private function getSystemPrompt(string $llmModel): string
    {
        $basePrompt = <<<'PROMPT'
You are StructLogr, an AI assistant that converts raw, multi-line log text into normalized JSON that helps developers debug quickly.

Rules you must follow:
1. Always return strictly valid JSON that conforms to the provided schema. Do not include Markdown, prose, or code fences.
2. Detect the dominant log category. Choose the closest match; if uncertain, use "general".
3. Build a concise summary capturing overall status, the primary subject, and key takeaways. When the log lacks data for a field, return null or an empty array as appropriate.
4. Capture important entities (tests, services, hosts, jobs, request IDs, etc.) exactly as they appear in the log.
5. Record quantitative metrics when counts, totals, or durations are mentioned. Omit a metric if no trustworthy value is present.
6. Populate sections with structured data tailored to the log content:
   - For test output, add section_type "test_results" with detailed test information.
   - For application errors or stack traces, prefer section_type "errors" or "exceptions".
   - For HTTP or access logs, use section_type "http_requests".
   - For build or CI logs, use section_type "build_steps".
   - For security or audit logs, use section_type "security_events".
   - Create multiple sections if the log includes mixed information.
7. Preserve multi-line strings such as stack traces verbatim.
8. Never invent information that does not exist in the log. If uncertain, leave values null or omit optional entries instead of guessing.
PROMPT;

        if ($llmModel === 'deepseek-chat') {
            return $basePrompt."\n\nReturn ONLY valid JSON with no additional text or explanation.";
        }

        return $basePrompt;
    }

    private function configureDeepseek($builder): void
    {
        \Log::debug('Configuring DeepSeek provider', [
            'provider' => 'DeepSeek',
            'model' => 'deepseek-chat',
            'response_format' => 'json_object',
        ]);

        $builder->using(Provider::DeepSeek, 'deepseek-chat')
            ->withProviderOptions([
                'response_format' => ['type' => 'json_object'],
            ]);
    }

    private function configureGemini($builder, ObjectSchema $schema): void
    {
        \Log::debug('Configuring Gemini provider', [
            'provider' => 'Gemini',
            'model' => 'gemini-2.5-flash',
            'response_mime_type' => 'application/json',
        ]);

        $builder->using(Provider::Gemini, 'gemini-2.5-flash')
            ->withProviderOptions([
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'responseSchema' => $this->convertSchemaToGeminiFormat($schema),
                ],
            ]);
    }

    private function configureMoonshot($builder, ObjectSchema $schema): void
    {
        \Log::debug('Configuring Moonshot provider', [
            'provider' => 'OpenRouter',
            'model' => 'moonshotai/kimi-k2',
            'response_format' => 'json_schema',
        ]);

        $builder->using(Provider::OpenRouter, 'moonshotai/kimi-k2')
            ->withProviderOptions([
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'formatted_log',
                        'schema' => $this->convertSchemaToJsonSchema($schema),
                    ],
                ],
            ]);
    }

    private function configureGLM($builder, ObjectSchema $schema, string $model): void
    {
        $openRouterModel = $this->mapGLMModelId($model);
        
        \Log::debug('Configuring GLM provider', [
            'provider' => 'OpenRouter',
            'internal_alias' => $model,
            'openrouter_model' => $openRouterModel,
            'response_format' => 'json_schema',
            'strict' => true,
            'thinking' => 'disabled',
        ]);

        $builder->using(Provider::OpenRouter, $openRouterModel)
            ->withProviderOptions([
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'formatted_log',
                        'strict' => true,
                        'schema' => $this->convertSchemaToJsonSchema($schema),
                    ],
                ],
                'thinking' => ['type' => 'disabled'],
            ]);
    }

    private function validateStructuredOutput(array $data): void
    {
        \Log::debug('Validating structured output fields');

        if (! isset($data['detected_log_type'])) {
            \Log::error('Validation failed: Missing detected_log_type');
            throw new \Exception('Missing required field: detected_log_type');
        }
        \Log::debug('Validation passed: detected_log_type', ['value' => $data['detected_log_type']]);

        if (! isset($data['summary']) || ! is_array($data['summary'])) {
            \Log::error('Validation failed: Missing or invalid summary');
            throw new \Exception('Missing or invalid required field: summary');
        }
        \Log::debug('Validation passed: summary exists');

        if (! isset($data['summary']['status']) || ! isset($data['summary']['headline'])) {
            \Log::error('Validation failed: Missing summary.status or summary.headline', [
                'has_status' => isset($data['summary']['status']),
                'has_headline' => isset($data['summary']['headline']),
            ]);
            throw new \Exception('Missing required summary fields: status or headline');
        }
        \Log::debug('Validation passed: summary.status and summary.headline', [
            'status' => $data['summary']['status'],
            'headline' => substr($data['summary']['headline'], 0, 100),
        ]);

        if (! isset($data['sections']) || ! is_array($data['sections'])) {
            \Log::error('Validation failed: Missing or invalid sections');
            throw new \Exception('Missing or invalid required field: sections');
        }
        \Log::debug('Validation passed: sections', ['count' => count($data['sections'])]);
    }

    private function convertSchemaToJsonSchema(ObjectSchema $schema): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'detected_log_type' => [
                    'type' => 'string',
                    'enum' => ['application_error', 'test_runner', 'build_pipeline', 'http_access', 'database', 'security_event', 'system_metrics', 'general'],
                ],
                'summary' => [
                    'type' => 'object',
                    'properties' => [
                        'status' => [
                            'type' => 'string',
                            'enum' => ['PASS', 'FAIL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'],
                        ],
                        'headline' => ['type' => 'string'],
                        'primary_subject' => ['type' => 'string'],
                        'key_points' => ['type' => 'array', 'items' => ['type' => 'string']],
                        'duration' => ['type' => 'string'],
                        'timestamp' => ['type' => 'string'],
                    ],
                    'required' => ['status', 'headline', 'primary_subject', 'key_points', 'duration', 'timestamp'],
                    'additionalProperties' => false,
                ],
                'entities' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'type' => ['type' => 'string'],
                            'identifier' => ['type' => 'string'],
                            'details' => ['type' => 'string'],
                        ],
                        'required' => ['type', 'identifier', 'details'],
                        'additionalProperties' => false,
                    ],
                ],
                'metrics' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'value' => ['type' => 'number'],
                            'unit' => ['type' => 'string'],
                            'description' => ['type' => 'string'],
                        ],
                        'required' => ['name', 'value', 'unit', 'description'],
                        'additionalProperties' => false,
                    ],
                ],
                'sections' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'section_type' => [
                                'type' => 'string',
                                'enum' => ['test_results', 'errors', 'exceptions', 'http_requests', 'build_steps', 'security_events', 'database_queries', 'performance_metrics', 'other'],
                            ],
                            'title' => ['type' => 'string'],
                            'description' => ['type' => 'string'],
                        ],
                        'required' => ['section_type', 'title', 'description'],
                        'additionalProperties' => true,
                    ],
                ],
            ],
            'required' => ['detected_log_type', 'summary', 'entities', 'metrics', 'sections'],
            'additionalProperties' => false,
        ];
    }

    private function convertSchemaToGeminiFormat(ObjectSchema $schema): array
    {
        return [
            'type' => 'OBJECT',
            'properties' => [
                'detected_log_type' => [
                    'type' => 'STRING',
                    'enum' => ['application_error', 'test_runner', 'build_pipeline', 'http_access', 'database', 'security_event', 'system_metrics', 'general'],
                ],
                'summary' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'status' => [
                            'type' => 'STRING',
                            'enum' => ['PASS', 'FAIL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'],
                        ],
                        'headline' => ['type' => 'STRING'],
                        'primary_subject' => ['type' => 'STRING', 'nullable' => true],
                        'key_points' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
                        'duration' => ['type' => 'STRING', 'nullable' => true],
                        'timestamp' => ['type' => 'STRING', 'nullable' => true],
                    ],
                    'required' => ['status', 'headline'],
                    'propertyOrdering' => ['status', 'headline', 'primary_subject', 'key_points', 'duration', 'timestamp'],
                ],
                'entities' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'type' => ['type' => 'STRING'],
                            'identifier' => ['type' => 'STRING'],
                            'details' => ['type' => 'STRING', 'nullable' => true],
                        ],
                        'required' => ['type', 'identifier'],
                        'propertyOrdering' => ['type', 'identifier', 'details'],
                    ],
                ],
                'metrics' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'name' => ['type' => 'STRING'],
                            'value' => ['type' => 'NUMBER', 'nullable' => true],
                            'unit' => ['type' => 'STRING', 'nullable' => true],
                            'description' => ['type' => 'STRING', 'nullable' => true],
                        ],
                        'required' => ['name'],
                        'propertyOrdering' => ['name', 'value', 'unit', 'description'],
                    ],
                ],
                'sections' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'section_type' => [
                                'type' => 'STRING',
                                'enum' => ['test_results', 'errors', 'exceptions', 'http_requests', 'build_steps', 'security_events', 'database_queries', 'performance_metrics', 'other'],
                            ],
                            'title' => ['type' => 'STRING', 'nullable' => true],
                            'description' => ['type' => 'STRING', 'nullable' => true],
                        ],
                        'required' => ['section_type'],
                        'propertyOrdering' => ['section_type', 'title', 'description'],
                    ],
                ],
            ],
            'required' => ['detected_log_type', 'summary', 'sections'],
            'propertyOrdering' => ['detected_log_type', 'summary', 'entities', 'metrics', 'sections'],
        ];
    }

    private function getSchema(): ObjectSchema
    {
        return new ObjectSchema(
            'formatted_log',
            'Normalized representation of a parsed log with contextual sections',
            [
                new EnumSchema(
                    'detected_log_type',
                    'High-level category of the log',
                    ['application_error', 'test_runner', 'build_pipeline', 'http_access', 'database', 'security_event', 'system_metrics', 'general']
                ),
                new ObjectSchema(
                    'summary',
                    'High-level summary data describing the overall outcome of the log',
                    [
                        new EnumSchema(
                            'status',
                            'Overall status or severity',
                            ['PASS', 'FAIL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']
                        ),
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
                            new EnumSchema(
                                'section_type',
                                'Machine-friendly type identifier',
                                ['test_results', 'errors', 'exceptions', 'http_requests', 'build_steps', 'security_events', 'database_queries', 'performance_metrics', 'other']
                            ),
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
    }

    private function applyPreferences(array $formattedLog, array $preferences): array
    {
        \Log::debug('Applying preferences', ['preferences' => $preferences]);

        if (isset($preferences['parseTimestamps']) && $preferences['parseTimestamps']) {
            \Log::info('Transforming timestamps', [
                'date_format' => $preferences['dateFormat'] ?? 'ISO8601',
                'timezone' => $preferences['timezone'] ?? 'UTC',
            ]);
            $formattedLog = $this->transformTimestamps(
                $formattedLog,
                $preferences['dateFormat'] ?? 'ISO8601',
                $preferences['timezone'] ?? 'UTC'
            );
        }

        if (isset($preferences['normalizeLogLevels']) && $preferences['normalizeLogLevels']) {
            \Log::info('Normalizing log levels');
            $formattedLog = $this->normalizeLogLevels($formattedLog);
        }

        \Log::debug('Preferences applied successfully');
        return $formattedLog;
    }

    private function transformTimestamps(array $data, string $format, string $timezone): array
    {
        if (isset($data['summary']['timestamp']) && ! empty($data['summary']['timestamp'])) {
            $data['summary']['timestamp'] = $this->formatTimestamp(
                $data['summary']['timestamp'],
                $format,
                $timezone
            );
        }

        if (isset($data['sections']) && is_array($data['sections'])) {
            foreach ($data['sections'] as $sectionIdx => $section) {
                if (isset($section['items']) && is_array($section['items'])) {
                    foreach ($section['items'] as $itemIdx => $item) {
                        if (isset($item['timestamp']) && ! empty($item['timestamp'])) {
                            $data['sections'][$sectionIdx]['items'][$itemIdx]['timestamp'] =
                                $this->formatTimestamp($item['timestamp'], $format, $timezone);
                        }
                    }
                }
            }
        }

        return $data;
    }

    private function formatTimestamp(string $timestamp, string $format, string $timezone): string
    {
        try {
            $date = new \DateTime($timestamp);

            if ($timezone === 'UTC') {
                $date->setTimezone(new \DateTimeZone('UTC'));
            } elseif ($timezone === 'Local') {
                $date->setTimezone(new \DateTimeZone(config('app.timezone', 'UTC')));
            }

            return match ($format) {
                'ISO8601' => $date->format('c'),
                'Unix' => (string) $date->getTimestamp(),
                'Custom' => $date->format('Y-m-d H:i:s'),
                default => $timestamp,
            };
        } catch (\Exception $e) {
            \Log::warning("Failed to parse timestamp: {$timestamp}", ['error' => $e->getMessage()]);

            return $timestamp;
        }
    }

    private function normalizeLogLevels(array $data): array
    {
        if (isset($data['summary']['status'])) {
            $data['summary']['status'] = strtoupper($data['summary']['status']);

            if ($data['summary']['status'] === 'WARN') {
                $data['summary']['status'] = 'WARNING';
            }
        }

        if (isset($data['sections']) && is_array($data['sections'])) {
            foreach ($data['sections'] as $sectionIdx => $section) {
                if (isset($section['items']) && is_array($section['items'])) {
                    foreach ($section['items'] as $itemIdx => $item) {
                        if (isset($item['status'])) {
                            $normalized = strtoupper($item['status']);
                            if ($normalized === 'WARN') {
                                $normalized = 'WARNING';
                            }
                            $data['sections'][$sectionIdx]['items'][$itemIdx]['status'] = $normalized;
                        }
                    }
                }
            }
        }

        return $data;
    }

    private function mapGLMModelId(string $model): string
    {
        return match ($model) {
            'zhipuai/glm-4.5-air', 'z-ai/glm-4.5-air' => 'z-ai/glm-4.5-air',
            'zhipuai/glm-4.6', 'z-ai/glm-4.6' => 'z-ai/glm-4.6',
            default => $model,
        };
    }
}

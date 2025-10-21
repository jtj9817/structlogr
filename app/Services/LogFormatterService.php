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
    public function format(string $rawLog, ?string $llmModel = null, int $maxRetries = 3): array
    {
        $llmModel = $llmModel ?? 'deepseek-chat';
        $attempt = 0;

        while ($attempt < $maxRetries) {
            try {
                $schema = $this->getSchema();
                $systemPrompt = $this->getSystemPrompt($llmModel);
                $prismBuilder = Prism::structured();

                match ($llmModel) {
                    'deepseek-chat' => $this->configureDeepseek($prismBuilder),
                    'gemini-2.5-flash' => $this->configureGemini($prismBuilder, $schema),
                    'kimi-k2-turbo-preview' => $this->configureMoonshot($prismBuilder, $schema),
                    'GLM-4.5-Air' => $this->configureGLM($prismBuilder, $schema, 'zhipuai/glm-4.5-air'),
                    'GLM-4.6' => $this->configureGLM($prismBuilder, $schema, 'zhipuai/glm-4.6'),
                    default => throw new \InvalidArgumentException("Unsupported LLM model: {$llmModel}"),
                };

                $response = $prismBuilder
                    ->withSystemPrompt($systemPrompt)
                    ->withSchema($schema)
                    ->withPrompt($rawLog)
                    ->temperature(0.0)
                    ->maxTokens(8192)
                    ->withClientOptions([
                        'timeout' => config('services.http.timeout', 600),
                        'connect_timeout' => config('services.http.connect_timeout', 60),
                    ])
                    ->asStructured();

                $structured = $response->structured;

                if (empty($structured)) {
                    throw new \Exception('Empty response from API');
                }

                $this->validateStructuredOutput($structured);

                return $structured;

            } catch (PrismException $e) {
                $attempt++;
                \Log::warning("Structured output attempt {$attempt} failed", [
                    'model' => $llmModel,
                    'error' => $e->getMessage(),
                    'code' => $e->getCode(),
                ]);

                if ($attempt >= $maxRetries) {
                    throw new \Exception(
                        "Failed to format log after {$maxRetries} attempts: ".$e->getMessage(),
                        $e->getCode(),
                        $e
                    );
                }

                sleep(pow(2, $attempt));

            } catch (\Exception $e) {
                $attempt++;
                \Log::warning("Structured output attempt {$attempt} failed", [
                    'model' => $llmModel,
                    'error' => $e->getMessage(),
                ]);

                if ($attempt >= $maxRetries) {
                    throw $e;
                }

                sleep(pow(2, $attempt));
            }
        }

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
        $builder->using(Provider::DeepSeek, 'deepseek-chat')
            ->withProviderOptions([
                'response_format' => ['type' => 'json_object'],
            ]);
    }

    private function configureGemini($builder, ObjectSchema $schema): void
    {
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
        $builder->using(Provider::OpenRouter, 'moonshot/kimi-k2-turbo-preview')
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
        $builder->using(Provider::OpenRouter, $model)
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
        if (! isset($data['detected_log_type'])) {
            throw new \Exception('Missing required field: detected_log_type');
        }

        if (! isset($data['summary']) || ! is_array($data['summary'])) {
            throw new \Exception('Missing or invalid required field: summary');
        }

        if (! isset($data['summary']['status']) || ! isset($data['summary']['headline'])) {
            throw new \Exception('Missing required summary fields: status or headline');
        }

        if (! isset($data['sections']) || ! is_array($data['sections'])) {
            throw new \Exception('Missing or invalid required field: sections');
        }
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
}

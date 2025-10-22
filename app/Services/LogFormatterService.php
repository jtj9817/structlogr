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
                    'has_data' => ! empty($structured),
                    'keys' => ! empty($structured) ? array_keys($structured) : [],
                ]);

                if (empty($structured)) {
                    \Log::error('Empty response from API', ['model' => $llmModel]);
                    throw new \Exception('Empty response from API');
                }

                \Log::info('Validating structured output');
                $this->validateStructuredOutput($structured);
                \Log::info('Structured output validated successfully');

                // Extract title for database storage
                $title = $structured['title'] ?? null;
                if (! $title || strlen($title) < 5) {
                    $summary = data_get($structured, 'results_summary.test_suite');
                    if (! $summary) {
                        $logType = data_get($structured, 'detected_log_type', 'unknown');
                        $status = data_get($structured, 'results_summary.status', 'INFO');
                        $summary = ucfirst($logType).' - '.$status;
                    }

                    if ($summary && strlen($summary) > 0) {
                        $title = Str::limit($summary, 47, '...');
                    } else {
                        $title = 'Untitled Log Entry';
                    }
                    \Log::warning('LogFormatterService: Missing or invalid title, using fallback', [
                        'provided_title' => $structured['title'] ?? null,
                        'fallback_used' => $title,
                    ]);
                }

                // Remove title from structured output (will be stored in dedicated column)
                unset($structured['title']);

                if ($preferences) {
                    \Log::info('Applying preferences to formatted log', ['preferences' => $preferences]);
                    $structured = $this->applyPreferences($structured, $preferences);
                    \Log::debug('Preferences applied successfully');
                }

                \Log::info('=== LogFormatterService::format() SUCCESS ===', [
                    'model' => $llmModel,
                    'attempt' => $attempt,
                    'detected_log_type' => $structured['detected_log_type'] ?? 'unknown',
                    'failed_tests_count' => count($structured['failed_tests'] ?? []),
                    'passed_tests_count' => count($structured['passed_tests'] ?? []),
                    'title' => $title,
                ]);

                return [
                    'structured' => $structured,
                    'title' => $title,
                ];

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
                \Log::info('Retrying after backoff', ['backoff_seconds' => $backoffSeconds]);
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
                \Log::info('Retrying after backoff', ['backoff_seconds' => $backoffSeconds]);
                sleep($backoffSeconds);
            }
        }

        \Log::critical('=== LogFormatterService::format() CRITICAL: Exceeded retry loop ===', [
            'model' => $llmModel,
            'attempts' => $attempt,
        ]);
        throw new \Exception('Unexpected error: exceeded retry loop');
    }

    public function saveLog(string $rawLog, array $formattedLog, string $title, ?User $user = null): ?FormattedLog
    {
        if (! $user) {
            return null;
        }

        $summary = data_get($formattedLog, 'results_summary.test_suite');
        if (! $summary) {
            $logType = data_get($formattedLog, 'detected_log_type', 'unknown');
            $status = data_get($formattedLog, 'results_summary.status', 'INFO');
            $summary = ucfirst($logType).' - '.$status;
        }

        $detectedType = data_get($formattedLog, 'detected_log_type');
        $fieldCount = is_array($formattedLog) ? count($formattedLog) : 0;

        return FormattedLog::create([
            'user_id' => $user->id,
            'raw_log' => $rawLog,
            'formatted_log' => $formattedLog,
            'detected_log_type' => $detectedType,
            'title' => $title,
            'summary' => Str::limit($summary, 255),
            'field_count' => $fieldCount,
        ]);
    }

    private function getSystemPrompt(string $llmModel): string
    {
        $basePrompt = <<<'PROMPT'
You are StructLogr, an AI that converts raw logs into concise, structured JSON for fast debugging.

Rules:
1. Return ONLY valid JSON matching the provided schema. No markdown, prose, or code fences.
2. Detect the dominant log category: test_runner, application_error, http_access, build_pipeline, database, security_event, system_metrics, or general.
3. Build a minimal results_summary with status, counts, duration, and timestamp. Use null for missing data.
4. For test logs:
   - Populate failed_tests array with test_case, status, duration, and failure_details embedded
   - failure_details should have: failure_type, message, location, test_file_location
   - Do NOT create separate error sections - embed errors in each failed test
   - Optionally include passed_tests array if relevant
5. For application errors:
   - Use errors array with error_type, message, file, line, stack_trace
6. For HTTP logs:
   - Use http_requests array with method, path, status_code, duration, ip
7. For build logs:
   - Use build_steps array with step_name, status, duration, error_message
8. Keep output flat - avoid deep nesting. Embed related info together.
9. Never invent data not in the log. Use null for missing optional fields.
10. Preserve exact error messages and stack traces verbatim.
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

        if (! isset($data['results_summary']) || ! is_array($data['results_summary'])) {
            \Log::error('Validation failed: Missing or invalid results_summary');
            throw new \Exception('Missing or invalid required field: results_summary');
        }
        \Log::debug('Validation passed: results_summary exists');

        if (! isset($data['results_summary']['status'])) {
            \Log::error('Validation failed: Missing results_summary.status');
            throw new \Exception('Missing required field: results_summary.status');
        }
        \Log::debug('Validation passed: results_summary.status', [
            'status' => $data['results_summary']['status'],
        ]);
    }

    private function convertSchemaToJsonSchema(ObjectSchema $schema): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'detected_log_type' => [
                    'type' => 'string',
                    'enum' => ['test_runner', 'application_error', 'http_access', 'build_pipeline', 'database', 'security_event', 'system_metrics', 'general'],
                ],
                'title' => [
                    'type' => 'string',
                    'description' => 'A concise, descriptive title for this log entry (5-50 characters). Should capture the key action or event. Examples: "Failed Login Attempt", "Database Connection Error", "User Registration Completed"',
                    'minLength' => 5,
                    'maxLength' => 50,
                ],
                'results_summary' => [
                    'type' => 'object',
                    'properties' => [
                        'status' => ['type' => 'string', 'enum' => ['PASS', 'FAIL', 'ERROR', 'WARN', 'INFO']],
                        'test_suite' => ['type' => 'string'],
                        'total' => ['type' => 'number'],
                        'passed' => ['type' => 'number'],
                        'failed' => ['type' => 'number'],
                        'assertions' => ['type' => 'number'],
                        'duration' => ['type' => 'string'],
                        'timestamp' => ['type' => 'string'],
                    ],
                    'required' => ['status'],
                    'additionalProperties' => false,
                ],
                'failed_tests' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'test_case' => ['type' => 'string'],
                            'status' => ['type' => 'string'],
                            'duration' => ['type' => 'string'],
                            'failure_details' => [
                                'type' => 'object',
                                'properties' => [
                                    'failure_type' => ['type' => 'string'],
                                    'message' => ['type' => 'string'],
                                    'location' => ['type' => 'string'],
                                    'test_file_location' => ['type' => 'string'],
                                ],
                                'required' => ['failure_type', 'message'],
                                'additionalProperties' => false,
                            ],
                        ],
                        'required' => ['test_case', 'status'],
                        'additionalProperties' => false,
                    ],
                ],
                'passed_tests' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'test_case' => ['type' => 'string'],
                            'status' => ['type' => 'string'],
                            'duration' => ['type' => 'string'],
                        ],
                        'required' => ['test_case', 'status'],
                        'additionalProperties' => false,
                    ],
                ],
                'errors' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'error_type' => ['type' => 'string'],
                            'message' => ['type' => 'string'],
                            'file' => ['type' => 'string'],
                            'line' => ['type' => 'number'],
                            'stack_trace' => ['type' => 'string'],
                            'timestamp' => ['type' => 'string'],
                        ],
                        'required' => ['error_type', 'message'],
                        'additionalProperties' => false,
                    ],
                ],
                'http_requests' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'method' => ['type' => 'string'],
                            'path' => ['type' => 'string'],
                            'status_code' => ['type' => 'number'],
                            'duration' => ['type' => 'string'],
                            'timestamp' => ['type' => 'string'],
                            'ip' => ['type' => 'string'],
                        ],
                        'required' => ['method', 'path', 'status_code'],
                        'additionalProperties' => false,
                    ],
                ],
                'build_steps' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'step_name' => ['type' => 'string'],
                            'status' => ['type' => 'string'],
                            'duration' => ['type' => 'string'],
                            'error_message' => ['type' => 'string'],
                        ],
                        'required' => ['step_name', 'status'],
                        'additionalProperties' => false,
                    ],
                ],
            ],
            'required' => ['detected_log_type', 'title', 'results_summary'],
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
                    'enum' => ['test_runner', 'application_error', 'http_access', 'build_pipeline', 'database', 'security_event', 'system_metrics', 'general'],
                ],
                'title' => [
                    'type' => 'STRING',
                    'description' => 'A concise, descriptive title for this log entry (5-50 characters). Should capture the key action or event. Examples: "Failed Login Attempt", "Database Connection Error", "User Registration Completed"',
                ],
                'results_summary' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'status' => ['type' => 'STRING', 'enum' => ['PASS', 'FAIL', 'ERROR', 'WARN', 'INFO']],
                        'test_suite' => ['type' => 'STRING', 'nullable' => true],
                        'total' => ['type' => 'NUMBER', 'nullable' => true],
                        'passed' => ['type' => 'NUMBER', 'nullable' => true],
                        'failed' => ['type' => 'NUMBER', 'nullable' => true],
                        'assertions' => ['type' => 'NUMBER', 'nullable' => true],
                        'duration' => ['type' => 'STRING', 'nullable' => true],
                        'timestamp' => ['type' => 'STRING', 'nullable' => true],
                    ],
                    'required' => ['status'],
                    'propertyOrdering' => ['status', 'test_suite', 'total', 'passed', 'failed', 'assertions', 'duration', 'timestamp'],
                ],
                'failed_tests' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'test_case' => ['type' => 'STRING'],
                            'status' => ['type' => 'STRING'],
                            'duration' => ['type' => 'STRING', 'nullable' => true],
                            'failure_details' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'failure_type' => ['type' => 'STRING'],
                                    'message' => ['type' => 'STRING'],
                                    'location' => ['type' => 'STRING', 'nullable' => true],
                                    'test_file_location' => ['type' => 'STRING', 'nullable' => true],
                                ],
                                'required' => ['failure_type', 'message'],
                                'propertyOrdering' => ['failure_type', 'message', 'location', 'test_file_location'],
                            ],
                        ],
                        'required' => ['test_case', 'status'],
                        'propertyOrdering' => ['test_case', 'status', 'duration', 'failure_details'],
                    ],
                ],
                'passed_tests' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'test_case' => ['type' => 'STRING'],
                            'status' => ['type' => 'STRING'],
                            'duration' => ['type' => 'STRING', 'nullable' => true],
                        ],
                        'required' => ['test_case', 'status'],
                        'propertyOrdering' => ['test_case', 'status', 'duration'],
                    ],
                ],
                'errors' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'error_type' => ['type' => 'STRING'],
                            'message' => ['type' => 'STRING'],
                            'file' => ['type' => 'STRING', 'nullable' => true],
                            'line' => ['type' => 'NUMBER', 'nullable' => true],
                            'stack_trace' => ['type' => 'STRING', 'nullable' => true],
                            'timestamp' => ['type' => 'STRING', 'nullable' => true],
                        ],
                        'required' => ['error_type', 'message'],
                        'propertyOrdering' => ['error_type', 'message', 'file', 'line', 'stack_trace', 'timestamp'],
                    ],
                ],
                'http_requests' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'method' => ['type' => 'STRING'],
                            'path' => ['type' => 'STRING'],
                            'status_code' => ['type' => 'NUMBER'],
                            'duration' => ['type' => 'STRING', 'nullable' => true],
                            'timestamp' => ['type' => 'STRING', 'nullable' => true],
                            'ip' => ['type' => 'STRING', 'nullable' => true],
                        ],
                        'required' => ['method', 'path', 'status_code'],
                        'propertyOrdering' => ['method', 'path', 'status_code', 'duration', 'timestamp', 'ip'],
                    ],
                ],
                'build_steps' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'step_name' => ['type' => 'STRING'],
                            'status' => ['type' => 'STRING'],
                            'duration' => ['type' => 'STRING', 'nullable' => true],
                            'error_message' => ['type' => 'STRING', 'nullable' => true],
                        ],
                        'required' => ['step_name', 'status'],
                        'propertyOrdering' => ['step_name', 'status', 'duration', 'error_message'],
                    ],
                ],
            ],
            'required' => ['detected_log_type', 'title', 'results_summary'],
            'propertyOrdering' => ['detected_log_type', 'title', 'results_summary', 'failed_tests', 'passed_tests', 'errors', 'http_requests', 'build_steps'],
        ];
    }

    private function getSchema(): ObjectSchema
    {
        return new ObjectSchema(
            'formatted_log',
            'Concise normalized log output optimized for readability',
            [
                new EnumSchema(
                    'detected_log_type',
                    'Category of the log',
                    ['test_runner', 'application_error', 'http_access', 'build_pipeline', 'database', 'security_event', 'system_metrics', 'general']
                ),
                new StringSchema(
                    'title',
                    'A concise, descriptive title for this log entry (5-50 characters). Should capture the key action or event. Examples: "Failed Login Attempt", "Database Connection Error", "User Registration Completed"',
                    false,
                    5,
                    50
                ),
                new ObjectSchema(
                    'results_summary',
                    'High-level metrics and status',
                    [
                        new EnumSchema('status', 'Overall status', ['PASS', 'FAIL', 'ERROR', 'WARN', 'INFO']),
                        new StringSchema('test_suite', 'Test suite or source identifier', true),
                        new NumberSchema('total', 'Total count', true),
                        new NumberSchema('passed', 'Passed count', true),
                        new NumberSchema('failed', 'Failed count', true),
                        new NumberSchema('assertions', 'Assertions count', true),
                        new StringSchema('duration', 'Total duration with unit', true),
                        new StringSchema('timestamp', 'Primary timestamp', true),
                    ],
                    ['status'],
                    true
                ),
                new ArraySchema(
                    'failed_tests',
                    'Failed test cases with embedded failure details',
                    new ObjectSchema(
                        'failed_test',
                        'Individual failed test',
                        [
                            new StringSchema('test_case', 'Test name'),
                            new StringSchema('status', 'Test status'),
                            new StringSchema('duration', 'Test duration with unit', true),
                            new ObjectSchema(
                                'failure_details',
                                'Structured failure information',
                                [
                                    new StringSchema('failure_type', 'Exception or error type'),
                                    new StringSchema('message', 'Error message'),
                                    new StringSchema('location', 'Primary error location', true),
                                    new StringSchema('test_file_location', 'Test file location', true),
                                ],
                                ['failure_type', 'message'],
                                true
                            ),
                        ],
                        ['test_case', 'status'],
                        true
                    ),
                    true
                ),
                new ArraySchema(
                    'passed_tests',
                    'Passed test cases',
                    new ObjectSchema(
                        'passed_test',
                        'Individual passed test',
                        [
                            new StringSchema('test_case', 'Test name'),
                            new StringSchema('status', 'Test status'),
                            new StringSchema('duration', 'Test duration with unit', true),
                        ],
                        ['test_case', 'status'],
                        true
                    ),
                    true
                ),
                new ArraySchema(
                    'errors',
                    'Application errors and exceptions',
                    new ObjectSchema(
                        'error',
                        'Error or exception details',
                        [
                            new StringSchema('error_type', 'Exception class or error type'),
                            new StringSchema('message', 'Error message'),
                            new StringSchema('file', 'File path', true),
                            new NumberSchema('line', 'Line number', true),
                            new StringSchema('stack_trace', 'Stack trace', true),
                            new StringSchema('timestamp', 'When error occurred', true),
                        ],
                        ['error_type', 'message'],
                        true
                    ),
                    true
                ),
                new ArraySchema(
                    'http_requests',
                    'HTTP request logs',
                    new ObjectSchema(
                        'request',
                        'HTTP request entry',
                        [
                            new StringSchema('method', 'HTTP method'),
                            new StringSchema('path', 'Request path'),
                            new NumberSchema('status_code', 'Response status code'),
                            new StringSchema('duration', 'Request duration', true),
                            new StringSchema('timestamp', 'Request timestamp', true),
                            new StringSchema('ip', 'Client IP', true),
                        ],
                        ['method', 'path', 'status_code'],
                        true
                    ),
                    true
                ),
                new ArraySchema(
                    'build_steps',
                    'Build or CI pipeline steps',
                    new ObjectSchema(
                        'step',
                        'Build step',
                        [
                            new StringSchema('step_name', 'Step name'),
                            new StringSchema('status', 'Step status'),
                            new StringSchema('duration', 'Step duration', true),
                            new StringSchema('error_message', 'Error if failed', true),
                        ],
                        ['step_name', 'status'],
                        true
                    ),
                    true
                ),
            ],
            ['detected_log_type', 'title', 'results_summary'],
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
        if (isset($data['results_summary']['timestamp']) && ! empty($data['results_summary']['timestamp'])) {
            $data['results_summary']['timestamp'] = $this->formatTimestamp(
                $data['results_summary']['timestamp'],
                $format,
                $timezone
            );
        }

        if (isset($data['errors']) && is_array($data['errors'])) {
            foreach ($data['errors'] as $idx => $error) {
                if (isset($error['timestamp']) && ! empty($error['timestamp'])) {
                    $data['errors'][$idx]['timestamp'] = $this->formatTimestamp(
                        $error['timestamp'],
                        $format,
                        $timezone
                    );
                }
            }
        }

        if (isset($data['http_requests']) && is_array($data['http_requests'])) {
            foreach ($data['http_requests'] as $idx => $request) {
                if (isset($request['timestamp']) && ! empty($request['timestamp'])) {
                    $data['http_requests'][$idx]['timestamp'] = $this->formatTimestamp(
                        $request['timestamp'],
                        $format,
                        $timezone
                    );
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
        if (isset($data['results_summary']['status'])) {
            $data['results_summary']['status'] = strtoupper($data['results_summary']['status']);

            if ($data['results_summary']['status'] === 'WARN') {
                $data['results_summary']['status'] = 'WARNING';
            }
        }

        if (isset($data['failed_tests']) && is_array($data['failed_tests'])) {
            foreach ($data['failed_tests'] as $idx => $test) {
                if (isset($test['status'])) {
                    $normalized = strtoupper($test['status']);
                    if ($normalized === 'WARN') {
                        $normalized = 'WARNING';
                    }
                    $data['failed_tests'][$idx]['status'] = $normalized;
                }
            }
        }

        if (isset($data['passed_tests']) && is_array($data['passed_tests'])) {
            foreach ($data['passed_tests'] as $idx => $test) {
                if (isset($test['status'])) {
                    $normalized = strtoupper($test['status']);
                    if ($normalized === 'WARN') {
                        $normalized = 'WARNING';
                    }
                    $data['passed_tests'][$idx]['status'] = $normalized;
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

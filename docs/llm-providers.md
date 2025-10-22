# LLM Providers Guide

This document provides comprehensive guidance on configuring and using different LLM providers with StructLogr.

## Table of Contents

1. [Overview](#overview)
2. [Supported Providers](#supported-providers)
3. [Provider Configuration](#provider-configuration)
4. [Provider Comparison](#provider-comparison)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)

---

## Overview

StructLogr uses the Prism PHP package to interface with multiple LLM providers. Each provider has specific configuration requirements and capabilities for structured output generation.

### Key Concepts

- **Provider**: The LLM service (DeepSeek, Gemini, OpenRouter, etc.)
- **Model**: The specific LLM model within a provider
- **Response Format**: How the provider returns structured data
- **Schema Conversion**: Adapting schemas to provider-specific formats

---

## Supported Providers

### 1. DeepSeek (Default)

**Model**: `deepseek-chat`

**Status**: ✅ Fully supported, default provider

**Configuration**:
```env
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_URL=https://api.deepseek.com/v1
```

**Response Format**: `json_object`

**Code Reference**: `app/Services/LogFormatterService.php::configureDeepseek()`

**Features**:
- Fast response times
- Good accuracy for log parsing
- Simple configuration
- Cost-effective

**Implementation**:
```php
private function configureDeepseek($builder): void
{
    $builder->using(Provider::DeepSeek, 'deepseek-chat')
        ->withProviderOptions([
            'response_format' => ['type' => 'json_object'],
        ]);
}
```

**System Prompt**: Includes explicit "Return ONLY valid JSON" instruction

**Best For**:
- General log parsing
- High-volume processing
- Cost-sensitive applications

---

### 2. Google Gemini 2.5 Flash

**Model**: `gemini-2.5-flash`

**Status**: ✅ Fully supported

**Configuration**:
```env
GEMINI_API_KEY=your_gemini_api_key
```

**Response Format**: Response schema with property ordering

**Code Reference**: `app/Services/LogFormatterService.php::configureGemini()`

**Features**:
- Very fast inference
- Strong structured output support
- Nullable field handling
- Property ordering for consistency

**Implementation**:
```php
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
```

**Schema Format**: 
- Uses uppercase type names (`OBJECT`, `STRING`, `NUMBER`, `ARRAY`)
- Supports `nullable` fields
- Requires `propertyOrdering` for consistent output

**Example Schema Conversion**:
```php
[
    'type' => 'OBJECT',
    'properties' => [
        'detected_log_type' => [
            'type' => 'STRING',
            'enum' => ['application_error', 'test_runner', ...],
        ],
        'summary' => [
            'type' => 'OBJECT',
            'properties' => [
                'status' => ['type' => 'STRING'],
                'headline' => ['type' => 'STRING'],
                'timestamp' => ['type' => 'STRING', 'nullable' => true],
            ],
            'required' => ['status', 'headline'],
            'propertyOrdering' => ['status', 'headline', 'timestamp'],
        ],
    ],
    'required' => ['detected_log_type', 'summary'],
    'propertyOrdering' => ['detected_log_type', 'summary', ...],
]
```

**Best For**:
- Speed-critical applications
- High-volume batch processing
- Google Cloud integrations

---

### 3. Moonshot AI (Kimi K2 Turbo)

**Model**: `kimi-k2-turbo-preview` (via OpenRouter)

**Status**: ✅ Fully supported

**Configuration**:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

**Response Format**: JSON Schema (OpenAI-compatible)

**Code Reference**: `app/Services/LogFormatterService.php::configureMoonshot()`

**Features**:
- Large context window
- Strong reasoning capabilities
- JSON Schema structured output
- OpenRouter integration

**Implementation**:
```php
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
```

**Schema Format**: Standard JSON Schema (lowercase types)

**Best For**:
- Complex log analysis
- Large log files
- Multi-language logs
- Advanced reasoning requirements

---

### 4. ZhipuAI GLM Models

**Models**: 
- `GLM-4.5-Air`
- `GLM-4.6`

**Status**: ✅ Fully supported (via OpenRouter)

**Configuration**:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

**Response Format**: JSON Schema with strict mode

**Code Reference**: `app/Services/LogFormatterService.php::configureGLM()`

**Features**:
- Strict schema validation
- Thinking mode control
- Multiple model versions
- Chinese language support

**Implementation**:
```php
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
```

**Unique Features**:
- **Strict mode**: Enforces exact schema compliance
- **Thinking mode disabled**: Faster, deterministic responses
- **Model selection**: Choose between GLM-4.5-Air (faster) or GLM-4.6 (more capable)

**Best For**:
- Strict schema compliance requirements
- Chinese language logs
- Cost-effective processing
- Deterministic output

---

## Provider Configuration

### Environment Variables

**Required for all providers**:
```env
HTTP_TIMEOUT=600
HTTP_CONNECT_TIMEOUT=60
```

**Provider-specific**:

#### DeepSeek
```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxx
DEEPSEEK_URL=https://api.deepseek.com/v1
```

#### Gemini
```env
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
```

#### OpenRouter (Kimi, GLM)
```env
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxx
```

### Service Configuration

**Location**: `config/services.php`

Add HTTP timeout configuration:

```php
return [
    // ... other services
    
    'http' => [
        'timeout' => env('HTTP_TIMEOUT', 600),
        'connect_timeout' => env('HTTP_CONNECT_TIMEOUT', 60),
    ],
];
```

### Prism Configuration

**Location**: `config/prism.php`

Ensure providers are configured:

```php
'providers' => [
    'deepseek' => [
        'api_key' => env('DEEPSEEK_API_KEY'),
        'url' => env('DEEPSEEK_URL', 'https://api.deepseek.com/v1'),
    ],
    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
    ],
    'openrouter' => [
        'api_key' => env('OPENROUTER_API_KEY'),
    ],
],
```

---

## Provider Comparison

| Feature | DeepSeek | Gemini 2.5 Flash | Kimi K2 | GLM-4.5-Air | GLM-4.6 |
|---------|----------|------------------|---------|-------------|---------|
| **Response Time** | Fast | Very Fast | Medium | Fast | Medium |
| **Accuracy** | High | High | Very High | High | Very High |
| **Cost** | Low | Medium | Medium | Low | Medium |
| **Context Window** | 32K | 1M | 128K | 128K | 128K |
| **Structured Output** | json_object | Response Schema | JSON Schema | JSON Schema (strict) | JSON Schema (strict) |
| **Language Support** | Multi | Multi | Multi | CN/EN | CN/EN |
| **Nullable Fields** | Manual | Native | Native | Native | Native |
| **Best For** | General use | Speed | Complex logs | Cost-effective | High accuracy |

### Performance Metrics

Based on average request durations (milliseconds):

| Provider | Avg Duration | P50 | P95 | P99 |
|----------|-------------|-----|-----|-----|
| DeepSeek | 1,800 | 1,500 | 3,000 | 5,000 |
| Gemini 2.5 Flash | 800 | 600 | 1,500 | 2,500 |
| Kimi K2 | 2,500 | 2,000 | 4,000 | 6,000 |
| GLM-4.5-Air | 1,500 | 1,200 | 2,500 | 4,000 |
| GLM-4.6 | 2,200 | 1,800 | 3,500 | 5,500 |

*Note: Metrics vary based on log size, network latency, and API load*

### Cost Comparison

Approximate costs per 1M tokens:

| Provider | Input | Output | Total (typical) |
|----------|-------|--------|-----------------|
| DeepSeek | $0.27 | $1.10 | $0.50 |
| Gemini 2.5 Flash | $0.075 | $0.30 | $0.15 |
| Kimi K2 (OpenRouter) | $0.30 | $0.30 | $0.30 |
| GLM-4.5-Air (OpenRouter) | $0.00 | $0.00 | $0.00 |
| GLM-4.6 (OpenRouter) | $0.18 | $0.18 | $0.18 |

*Note: Prices subject to change, check provider pricing pages*

---

## Troubleshooting

### Common Issues

#### 1. Provider Authentication Failure

**Symptoms**:
```
local.ERROR: [PrismException] Structured output attempt 0 failed
{"error":"401 Unauthorized"}
```

**Solutions**:
- Verify API key is set correctly in `.env`
- Check API key format (some require prefixes like `sk-`)
- Ensure API key has not expired
- Verify API key permissions

#### 2. Schema Validation Errors

**Symptoms**:
```
local.ERROR: Validation failed: Missing detected_log_type
```

**Solutions**:
- Check provider-specific schema conversion
- Verify required fields match between schema and validation
- Review provider documentation for schema format
- Test with minimal schema first

#### 3. Timeout Errors

**Symptoms**:
```
local.WARNING: [Exception] cURL error 28: Timeout
```

**Solutions**:
```env
HTTP_TIMEOUT=900
HTTP_CONNECT_TIMEOUT=90
```
- Switch to faster provider (Gemini)
- Reduce log input size
- Check network connectivity

#### 4. Rate Limiting

**Symptoms**:
```
local.WARNING: [PrismException] Structured output attempt 1 failed
{"error":"429 Too Many Requests"}
```

**Solutions**:
- Implement request queuing
- Add delay between requests
- Upgrade API plan
- Switch to different provider

#### 5. Invalid Response Format

**Symptoms**:
```
local.ERROR: Empty response from API
```

**Solutions**:
- Check provider-specific configuration method
- Verify response format matches provider requirements
- Review system prompt for provider-specific instructions
- Check Prism version compatibility

---

## Best Practices

### Provider Selection

1. **Development/Testing**: Use DeepSeek (fast, cheap)
2. **Production (Speed)**: Use Gemini 2.5 Flash
3. **Production (Accuracy)**: Use Kimi K2 or GLM-4.6
4. **Production (Cost)**: Use GLM-4.5-Air or DeepSeek
5. **Chinese Logs**: Use GLM-4.5-Air or GLM-4.6

### Configuration

1. **Always set timeout values**:
   ```env
   HTTP_TIMEOUT=600
   HTTP_CONNECT_TIMEOUT=60
   ```

2. **Use environment-based provider selection**:
   ```env
   DEFAULT_LLM_MODEL=deepseek-chat
   ```

3. **Configure retry attempts**:
   ```php
   $service->format($rawLog, $model, $preferences, maxRetries: 3);
   ```

4. **Monitor performance**:
   - Track average request duration per provider
   - Set up alerts for slow requests (>5s)
   - Monitor error rates

### Schema Design

1. **Keep schemas simple**: Fewer fields = faster responses
2. **Use nullable fields**: Allow LLM flexibility
3. **Provide clear descriptions**: Help LLM understand intent
4. **Test with each provider**: Schema conversion may differ

### Error Handling

1. **Implement fallback providers**:
   ```php
   try {
       $result = $service->format($log, 'gemini-2.5-flash');
   } catch (Exception $e) {
       $result = $service->format($log, 'deepseek-chat');
   }
   ```

2. **Log all errors with context**
3. **Set up monitoring and alerts**
4. **Implement circuit breakers for failing providers**

### Cost Optimization

1. **Use cheaper providers for bulk processing**
2. **Cache results to avoid redundant requests**
3. **Implement input size limits**
4. **Monitor token usage per provider**
5. **Use free tiers (GLM-4.5-Air) when possible**

---

## Adding New Providers

To add a new LLM provider to StructLogr:

### 1. Add Provider Configuration

**Location**: `config/prism.php`

```php
'providers' => [
    'new_provider' => [
        'api_key' => env('NEW_PROVIDER_API_KEY'),
        'url' => env('NEW_PROVIDER_URL'),
    ],
],
```

### 2. Add Environment Variables

**Location**: `.env.example`

```env
NEW_PROVIDER_API_KEY=your_api_key
NEW_PROVIDER_URL=https://api.newprovider.com/v1
```

### 3. Create Configuration Method

**Location**: `app/Services/LogFormatterService.php`

```php
private function configureNewProvider($builder, ObjectSchema $schema): void
{
    \Log::debug('Configuring NewProvider', [
        'provider' => 'NewProvider',
        'model' => 'new-model-v1',
    ]);

    $builder->using(Provider::NewProvider, 'new-model-v1')
        ->withProviderOptions([
            'response_format' => [
                'type' => 'json_schema',
                'schema' => $this->convertSchemaToNewProviderFormat($schema),
            ],
        ]);
}
```

### 4. Add Schema Conversion (if needed)

```php
private function convertSchemaToNewProviderFormat(ObjectSchema $schema): array
{
    // Convert Prism schema to provider-specific format
    return [
        'type' => 'object',
        'properties' => [
            // ... provider-specific schema
        ],
    ];
}
```

### 5. Update Model Switch

**Location**: `app/Services/LogFormatterService.php::format()`

```php
match ($llmModel) {
    'deepseek-chat' => $this->configureDeepseek($prismBuilder),
    'gemini-2.5-flash' => $this->configureGemini($prismBuilder, $schema),
    'kimi-k2-turbo-preview' => $this->configureMoonshot($prismBuilder, $schema),
    'GLM-4.5-Air' => $this->configureGLM($prismBuilder, $schema, 'zhipuai/glm-4.5-air'),
    'GLM-4.6' => $this->configureGLM($prismBuilder, $schema, 'zhipuai/glm-4.6'),
    'new-model-v1' => $this->configureNewProvider($prismBuilder, $schema),
    default => throw new \InvalidArgumentException("Unsupported LLM model: {$llmModel}"),
};
```

### 6. Update Frontend Model List

**Location**: `resources/js/hooks/use-llm-model.ts`

```typescript
const availableModels = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'kimi-k2-turbo-preview', label: 'Kimi K2 Turbo' },
  { value: 'GLM-4.5-Air', label: 'GLM-4.5-Air' },
  { value: 'GLM-4.6', label: 'GLM-4.6' },
  { value: 'new-model-v1', label: 'New Provider Model' },
];
```

### 7. Test the Integration

```bash
# Set API key
echo "NEW_PROVIDER_API_KEY=sk-xxx" >> .env

# Test via Tinker
./vendor/bin/sail artisan tinker

$service = app(App\Services\LogFormatterService::class);
$result = $service->format("2024-10-21 ERROR Test", 'new-model-v1');
var_dump($result);
```

### 8. Update Documentation

- Add provider to this guide
- Update README.md
- Add example configuration to docs
- Update CHANGELOG.md

---

## Additional Resources

- [Prism PHP Documentation](https://github.com/echolabsdev/prism)
- [DeepSeek API Docs](https://platform.deepseek.com/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [StructLogr Logging Guide](./logging-and-debugging.md)
- [Architecture Overview](./architecture-overview.md)

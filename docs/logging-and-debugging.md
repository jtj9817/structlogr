# Logging and Debugging Guide

This document provides comprehensive guidance on StructLogr's logging system and debugging capabilities.

## Table of Contents

1. [Overview](#overview)
2. [LogFormatterService Logging](#logformatterservice-logging)
3. [Log Levels](#log-levels)
4. [Viewing Logs](#viewing-logs)
5. [Debugging Workflows](#debugging-workflows)
6. [Performance Monitoring](#performance-monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Overview

StructLogr implements comprehensive logging throughout the log formatting pipeline to aid in debugging, performance monitoring, and error tracking. The logging system provides detailed context at each stage of processing.

### Key Features

- **Structured Logging**: All logs include contextual metadata
- **Multiple Log Levels**: info, debug, warning, error, critical
- **Request Timing**: Precise measurements of API request duration
- **Retry Tracking**: Detailed logging of retry attempts
- **Validation Logging**: Step-by-step validation progress
- **Error Context**: Rich error information for troubleshooting

---

## LogFormatterService Logging

The `LogFormatterService` class (`app/Services/LogFormatterService.php`) provides the most comprehensive logging in the application.

### Request Lifecycle Logging

#### 1. Request Start

```php
\Log::info('=== LogFormatterService::format() START ===', [
    'llm_model' => 'deepseek-chat',
    'preferences' => null,
    'max_retries' => 3,
    'raw_log_length' => 245,
    'raw_log_preview' => '2024-10-15 14:23:45 [ERROR] Database connection failed...',
]);
```

**Context Provided**:
- Selected LLM model
- User preferences (if any)
- Maximum retry attempts configured
- Raw log length (for detecting large inputs)
- First 200 characters of input (for debugging)

#### 2. Retry Attempt Tracking

```php
\Log::info("Attempt {$attempt}/{$maxRetries} starting", [
    'attempt' => 0,
    'model' => 'deepseek-chat',
]);
```

**Context Provided**:
- Current attempt number (0-indexed)
- Total retry attempts allowed
- LLM model being used

#### 3. Schema Generation

```php
\Log::debug('Schema generated', [
    'schema_name' => 'formatted_log'
]);
```

#### 4. System Prompt Generation

```php
\Log::debug('System prompt generated', [
    'model' => 'deepseek-chat',
    'prompt_length' => 1024,
]);
```

#### 5. Provider Configuration

```php
\Log::info('Configuring LLM provider', ['model' => 'deepseek-chat']);

// Provider-specific logging
\Log::debug('Configuring DeepSeek provider', [
    'provider' => 'DeepSeek',
    'model' => 'deepseek-chat',
    'response_format' => 'json_object',
]);
```

**Context Provided**:
- Provider name (DeepSeek, Gemini, OpenRouter, etc.)
- Model identifier
- Response format configuration
- Provider-specific options

#### 6. API Request

```php
\Log::info('Sending request to LLM API', [
    'model' => 'deepseek-chat',
    'temperature' => 0.0,
    'max_tokens' => 8192,
    'timeout' => 600,
    'connect_timeout' => 60,
]);
```

**Context Provided**:
- LLM model
- Temperature setting
- Max tokens limit
- HTTP timeout values

#### 7. API Response

```php
\Log::info('LLM API response received', [
    'model' => 'deepseek-chat',
    'duration_ms' => 1847.32,
]);
```

**Context Provided**:
- LLM model
- Request duration in milliseconds (precise timing)

#### 8. Structured Output Extraction

```php
\Log::debug('Structured output extracted', [
    'has_data' => true,
    'keys' => ['detected_log_type', 'summary', 'entities', 'metrics', 'sections'],
]);
```

#### 9. Validation

```php
\Log::info('Validating structured output');

\Log::debug('Validating structured output fields');

\Log::debug('Validation passed: detected_log_type', [
    'value' => 'application_error'
]);

\Log::debug('Validation passed: summary exists');

\Log::debug('Validation passed: summary.status and summary.headline', [
    'status' => 'ERROR',
    'headline' => 'Database connection failed after timing out at 30s',
]);

\Log::debug('Validation passed: sections', [
    'count' => 1
]);
```

**Context Provided**:
- Each validation step result
- Field values for debugging
- Array counts for collections

#### 10. Preferences Application

```php
\Log::info('Applying preferences to formatted log', [
    'preferences' => ['parseTimestamps' => true, 'dateFormat' => 'ISO8601']
]);

\Log::info('Transforming timestamps', [
    'date_format' => 'ISO8601',
    'timezone' => 'UTC',
]);

\Log::info('Normalizing log levels');
```

#### 11. Request Success

```php
\Log::info('=== LogFormatterService::format() SUCCESS ===', [
    'model' => 'deepseek-chat',
    'attempt' => 0,
    'detected_log_type' => 'application_error',
    'sections_count' => 1,
]);
```

**Context Provided**:
- LLM model used
- Attempt number (shows if retries occurred)
- Detected log type
- Number of sections extracted

### Error Logging

#### Empty Response Error

```php
\Log::error('Empty response from API', [
    'model' => 'deepseek-chat'
]);
```

#### Validation Errors

```php
\Log::error('Validation failed: Missing detected_log_type');

\Log::error('Validation failed: Missing or invalid summary');

\Log::error('Validation failed: Missing summary.status or summary.headline', [
    'has_status' => false,
    'has_headline' => true,
]);

\Log::error('Validation failed: Missing or invalid sections');
```

#### Retry Warnings

```php
\Log::warning("[PrismException] Structured output attempt {$attempt} failed", [
    'model' => 'deepseek-chat',
    'error' => $e->getMessage(),
    'code' => $e->getCode(),
    'attempt' => 1,
    'max_retries' => 3,
]);

\Log::warning("[Exception] Structured output attempt {$attempt} failed", [
    'model' => 'deepseek-chat',
    'error' => $e->getMessage(),
    'exception_type' => 'InvalidArgumentException',
    'attempt' => 1,
    'max_retries' => 3,
]);
```

#### Fatal Errors

```php
\Log::error('=== LogFormatterService::format() FAILED (Max retries exceeded) ===', [
    'model' => 'deepseek-chat',
    'attempts' => 3,
    'error' => 'Timeout after 600s',
]);

\Log::critical('=== LogFormatterService::format() CRITICAL: Exceeded retry loop ===', [
    'model' => 'deepseek-chat',
    'attempts' => 3,
]);
```

#### Timestamp Parsing Warnings

```php
\Log::warning("Failed to parse timestamp: {$timestamp}", [
    'error' => 'Invalid date format'
]);
```

---

## Log Levels

StructLogr uses Laravel's built-in logging system with PSR-3 log levels:

### info

**Usage**: General informational messages about request flow

**Examples**:
- Request start/end
- Retry attempts
- Successful operations
- Configuration changes

### debug

**Usage**: Detailed diagnostic information

**Examples**:
- Schema generation
- Validation steps
- Provider configuration details
- Data extraction

### warning

**Usage**: Exceptional occurrences that are not errors

**Examples**:
- Retry attempts after failures
- Fallback behavior
- Timestamp parsing failures

### error

**Usage**: Runtime errors that do not require immediate action

**Examples**:
- Validation failures
- Empty API responses
- Missing required fields
- Max retries exceeded

### critical

**Usage**: Critical conditions requiring immediate attention

**Examples**:
- Unexpected loop exit
- System integrity issues

---

## Viewing Logs

### Development (Laravel Sail)

**Default log location**: `storage/logs/laravel.log`

**View logs in real-time**:
```bash
./vendor/bin/sail exec laravel.test tail -f storage/logs/laravel.log
```

**View with filtering**:
```bash
./vendor/bin/sail exec laravel.test tail -f storage/logs/laravel.log | grep "LogFormatterService"
```

**View only errors**:
```bash
./vendor/bin/sail exec laravel.test tail -f storage/logs/laravel.log | grep "ERROR"
```

**View specific request**:
```bash
./vendor/bin/sail exec laravel.test grep "deepseek-chat" storage/logs/laravel.log
```

### Log Configuration

**Location**: `config/logging.php`

**Default stack**: `single` (writes to `storage/logs/laravel.log`)

**Environment-based logging**:
```env
LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug
```

### Production Logging

For production, configure `config/logging.php` to use:

- **daily**: Rotates logs daily
- **syslog**: System logging
- **errorlog**: PHP error log
- **slack**: Send errors to Slack
- **papertrail**: Cloud logging service

---

## Debugging Workflows

### Debugging Failed Formatting Requests

1. **Check the request start log**:
   ```
   local.INFO: === LogFormatterService::format() START ===
   ```
   Verify: model selection, input length, preferences

2. **Check retry attempts**:
   ```
   local.INFO: Attempt 0/3 starting
   ```
   Multiple attempts indicate API issues

3. **Check provider configuration**:
   ```
   local.DEBUG: Configuring DeepSeek provider
   ```
   Verify: provider name, model, response format

4. **Check API timing**:
   ```
   local.INFO: LLM API response received {"duration_ms":1847.32}
   ```
   High duration (>5000ms) may indicate API performance issues

5. **Check validation**:
   ```
   local.ERROR: Validation failed: Missing detected_log_type
   ```
   Indicates schema compliance issues

6. **Check final result**:
   ```
   local.INFO: === LogFormatterService::format() SUCCESS ===
   ```
   Or look for FAILED/CRITICAL logs

### Debugging Specific LLM Providers

#### DeepSeek Issues

**Check for**:
```
local.DEBUG: Configuring DeepSeek provider
local.INFO: Sending request to LLM API {"model":"deepseek-chat"}
```

**Common issues**:
- API key not configured
- Rate limiting (check retry warnings)
- Response format issues (should be `json_object`)

#### Gemini Issues

**Check for**:
```
local.DEBUG: Configuring Gemini provider
```

**Common issues**:
- API key missing (`GEMINI_API_KEY`)
- Schema conversion errors
- Property ordering issues

#### OpenRouter (Kimi, GLM) Issues

**Check for**:
```
local.DEBUG: Configuring Moonshot provider
local.DEBUG: Configuring GLM provider
```

**Common issues**:
- OpenRouter API key missing
- Strict schema validation failures
- Model not available via OpenRouter

### Debugging Performance Issues

1. **Track request duration**:
   ```bash
   grep "duration_ms" storage/logs/laravel.log | tail -20
   ```

2. **Find slow requests** (>5 seconds):
   ```bash
   grep "duration_ms" storage/logs/laravel.log | grep -E "[0-9]{5,}\."
   ```

3. **Calculate average duration**:
   ```bash
   grep "duration_ms" storage/logs/laravel.log | grep -oP 'duration_ms":\K[0-9.]+' | awk '{sum+=$1; count++} END {print sum/count}'
   ```

### Debugging Validation Failures

1. **Check which field failed**:
   ```bash
   grep "Validation failed" storage/logs/laravel.log
   ```

2. **Check structured output**:
   ```bash
   grep "Structured output extracted" storage/logs/laravel.log -A 2
   ```

3. **Review schema definition**:
   - Check `app/Services/LogFormatterService.php::getSchema()`
   - Verify required fields match validation

---

## Performance Monitoring

### Request Timing

The service logs precise timing for each API request:

```php
$startTime = microtime(true);
// ... API call ...
$duration = round((microtime(true) - $startTime) * 1000, 2);
\Log::info('LLM API response received', [
    'duration_ms' => $duration,
]);
```

### Performance Metrics to Track

1. **Average request duration** by model
2. **Retry rate** (attempts > 0 / total requests)
3. **Error rate** (failed requests / total requests)
4. **Timeout rate** (timeout errors / total requests)

### Example Analysis Query

```bash
# Get all request durations for last hour
grep "$(date +%Y-%m-%d\ %H)" storage/logs/laravel.log | grep "duration_ms"
```

---

## Troubleshooting

### Common Issues

#### 1. Empty API Response

**Log signature**:
```
local.ERROR: Empty response from API
```

**Causes**:
- API timeout
- Invalid API key
- Rate limiting
- Provider service outage

**Solution**:
- Check API key configuration
- Verify network connectivity
- Check provider status page
- Increase timeout values

#### 2. Validation Failures

**Log signature**:
```
local.ERROR: Validation failed: Missing detected_log_type
```

**Causes**:
- LLM returned incomplete response
- Schema mismatch between provider and service
- Provider not following structured output format

**Solution**:
- Check provider configuration method
- Verify schema conversion for provider
- Review system prompt for clarity
- Try different LLM model

#### 3. Max Retries Exceeded

**Log signature**:
```
local.ERROR: === LogFormatterService::format() FAILED (Max retries exceeded) ===
```

**Causes**:
- Persistent API failures
- Network issues
- Provider outage

**Solution**:
- Check provider status
- Verify API credentials
- Increase max retries (not recommended)
- Switch to different provider

#### 4. Timeout Issues

**Log signature**:
```
local.WARNING: [Exception] Structured output attempt 1 failed {"error":"cURL error 28: Timeout"}
```

**Causes**:
- Slow provider response
- Large log input
- Network latency

**Solution**:
- Increase timeout in `.env`:
  ```env
  HTTP_TIMEOUT=900
  HTTP_CONNECT_TIMEOUT=90
  ```
- Reduce input size
- Switch to faster provider

#### 5. Infinite Retry Loop (Critical)

**Log signature**:
```
local.CRITICAL: === LogFormatterService::format() CRITICAL: Exceeded retry loop ===
```

**Causes**:
- Logic error in retry mechanism
- Should never occur in normal operation

**Solution**:
- This is a critical bug
- Report immediately
- Check service code for logic errors

### Debugging Checklist

When debugging issues:

- [ ] Check Laravel log file exists and is writable
- [ ] Verify log level is set to `debug` in `.env`
- [ ] Check API keys are configured
- [ ] Verify network connectivity to LLM provider
- [ ] Review recent changes to service code
- [ ] Check provider status pages
- [ ] Verify schema definitions are correct
- [ ] Test with minimal log input
- [ ] Try different LLM model
- [ ] Review retry attempt logs for patterns

---

## Best Practices

### Development

1. **Always use debug log level** during development:
   ```env
   LOG_LEVEL=debug
   ```

2. **Monitor logs in real-time** during testing:
   ```bash
   ./vendor/bin/sail exec laravel.test tail -f storage/logs/laravel.log
   ```

3. **Test each LLM provider** separately to verify configuration

4. **Review validation logs** to ensure schema compliance

### Production

1. **Use info or warning level** to reduce log volume:
   ```env
   LOG_LEVEL=info
   ```

2. **Configure log rotation** to prevent disk space issues

3. **Set up alerts** for critical and error logs

4. **Monitor performance metrics** regularly

5. **Archive old logs** for compliance and analysis

---

## Additional Resources

- [Laravel Logging Documentation](https://laravel.com/docs/12.x/logging)
- [PSR-3 Logger Interface](https://www.php-fig.org/psr/psr-3/)
- [Prism SDK Documentation](https://github.com/your-repo/prism)
- [StructLogr Architecture Overview](./architecture-overview.md)
- [LLM Providers Guide](./llm-providers.md)

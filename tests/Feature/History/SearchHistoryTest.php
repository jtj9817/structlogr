<?php

use App\Models\FormattedLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

uses(RefreshDatabase::class);

it('returns matching results for the authenticated user', function () {
    $user = User::factory()->create();

    FormattedLog::query()->create([
        'user_id' => $user->id,
        'raw_log' => '2025-10-22 08:22:11 ERROR gateway timeout after 30s',
        'formatted_log' => ['level' => 'error'],
        'summary' => 'Gateway timeout',
        'detected_log_type' => 'http',
        'title' => 'Timeout at gateway',
        'field_count' => 18,
        'is_saved' => true,
    ]);

    FormattedLog::query()->create([
        'user_id' => $user->id,
        'raw_log' => 'Service recovered successfully',
        'formatted_log' => ['level' => 'info'],
        'summary' => 'Recovery event',
        'detected_log_type' => 'system',
        'title' => 'System recovery',
        'field_count' => 4,
        'is_saved' => false,
    ]);

    actingAs($user);

    $response = getJson(route('history.search', [
        'query' => 'timeout',
    ]));

    $response
        ->assertOk()
        ->assertJsonPath('data.query', 'timeout')
        ->assertJsonPath('data.meta.limit', 20)
        ->assertJsonPath('data.meta.scope', 'all')
        ->assertJsonPath('data.meta.count', 1)
        ->assertJsonCount(1, 'data.results')
        ->assertJsonFragment([
            'title' => 'Timeout at gateway',
            'summary' => 'Gateway timeout',
            'detectedLogType' => 'http',
            'isSaved' => true,
            'collection' => 'saved',
        ]);
});

it('filters results by scope saved', function () {
    $user = User::factory()->create();

    FormattedLog::query()->create([
        'user_id' => $user->id,
        'raw_log' => 'Saved alert triggered',
        'formatted_log' => ['level' => 'error'],
        'summary' => 'Critical alert',
        'detected_log_type' => 'alert',
        'title' => 'Critical alert',
        'field_count' => 9,
        'is_saved' => true,
    ]);

    FormattedLog::query()->create([
        'user_id' => $user->id,
        'raw_log' => 'Recent alert triggered',
        'formatted_log' => ['level' => 'error'],
        'summary' => 'Critical alert again',
        'detected_log_type' => 'alert',
        'title' => 'Critical alert duplicate',
        'field_count' => 9,
        'is_saved' => false,
    ]);

    actingAs($user);

    $response = getJson(route('history.search', [
        'query' => 'alert',
        'scope' => 'saved',
    ]));

    $response
        ->assertOk()
        ->assertJsonPath('data.meta.scope', 'saved')
        ->assertJsonPath('data.meta.count', 1)
        ->assertJsonCount(1, 'data.results')
        ->assertJsonFragment([
            'title' => 'Critical alert',
            'collection' => 'saved',
            'isSaved' => true,
        ]);
});

it('returns empty results when nothing matches', function () {
    $user = User::factory()->create();

    FormattedLog::query()->create([
        'user_id' => $user->id,
        'raw_log' => 'System boot completed',
        'formatted_log' => ['level' => 'info'],
        'summary' => 'Boot event',
        'detected_log_type' => 'system',
        'title' => 'Boot complete',
        'field_count' => 3,
        'is_saved' => false,
    ]);

    actingAs($user);

    $response = getJson(route('history.search', [
        'query' => 'timeout',
    ]));

    $response
        ->assertOk()
        ->assertJsonPath('data.meta.count', 0)
        ->assertJsonCount(0, 'data.results');
});

it('requires authentication', function () {
    $response = getJson(route('history.search', [
        'query' => 'anything',
    ]));

    $response->assertUnauthorized();
});

it('does not return other users entries', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    FormattedLog::query()->create([
        'user_id' => $otherUser->id,
        'raw_log' => 'Other user timeout issue',
        'formatted_log' => ['level' => 'error'],
        'summary' => 'Other user data',
        'detected_log_type' => 'http',
        'title' => 'Other timeout',
        'field_count' => 5,
        'is_saved' => true,
    ]);

    FormattedLog::query()->create([
        'user_id' => $user->id,
        'raw_log' => 'My timeout issue',
        'formatted_log' => ['level' => 'error'],
        'summary' => 'My data',
        'detected_log_type' => 'http',
        'title' => 'My timeout',
        'field_count' => 5,
        'is_saved' => false,
    ]);

    actingAs($user);

    $response = getJson(route('history.search', [
        'query' => 'timeout',
    ]));

    $response
        ->assertOk()
        ->assertJsonPath('data.meta.count', 1)
        ->assertJsonFragment([
            'title' => 'My timeout',
        ])
        ->assertJsonMissing([
            'title' => 'Other timeout',
        ]);
});

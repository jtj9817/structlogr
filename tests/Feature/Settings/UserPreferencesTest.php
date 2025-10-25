<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('user preferences return defaults when null', function () {
    $user = User::factory()->withoutTwoFactor()->create(['preferences' => null]);

    expect($user->preferences)->toBeArray()
        ->and($user->preferences['outputFormat'])->toBe('json')
        ->and($user->preferences['jsonIndentation'])->toBe(2)
        ->and($user->preferences['autoCopyResults'])->toBe(false)
        ->and($user->preferences['showLineNumbers'])->toBe(true)
        ->and($user->preferences['saveToHistory'])->toBe(true)
        ->and($user->preferences['anonymousAnalytics'])->toBe(true)
        ->and($user->preferences['avoidSensitiveStorage'])->toBe(false)
        ->and($user->preferences['fontSize'])->toBe('medium')
        ->and($user->preferences['reduceAnimations'])->toBe(false)
        ->and($user->preferences['customApiEndpoint'])->toBe('')
        ->and($user->preferences['apiKey'])->toBe('')
        ->and($user->preferences['timeoutSeconds'])->toBe(30);
});

test('user preferences return defaults when empty string', function () {
    $user = User::factory()->withoutTwoFactor()->create(['preferences' => '']);

    expect($user->preferences)->toBeArray()
        ->and($user->preferences['outputFormat'])->toBe('json')
        ->and($user->preferences['jsonIndentation'])->toBe(2)
        ->and($user->preferences['autoCopyResults'])->toBe(false)
        ->and($user->preferences['showLineNumbers'])->toBe(true)
        ->and($user->preferences['saveToHistory'])->toBe(true)
        ->and($user->preferences['anonymousAnalytics'])->toBe(true)
        ->and($user->preferences['avoidSensitiveStorage'])->toBe(false)
        ->and($user->preferences['fontSize'])->toBe('medium')
        ->and($user->preferences['reduceAnimations'])->toBe(false)
        ->and($user->preferences['customApiEndpoint'])->toBe('')
        ->and($user->preferences['apiKey'])->toBe('')
        ->and($user->preferences['timeoutSeconds'])->toBe(30);
});

test('preferences are merged with defaults for partial data', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => json_encode(['outputFormat' => 'table', 'fontSize' => 'large']),
    ]);

    expect($user->preferences)->toBeArray()
        ->and($user->preferences['outputFormat'])->toBe('table')
        ->and($user->preferences['fontSize'])->toBe('large')
        ->and($user->preferences['jsonIndentation'])->toBe(2)
        ->and($user->preferences['autoCopyResults'])->toBe(false)
        ->and($user->preferences['showLineNumbers'])->toBe(true)
        ->and($user->preferences['saveToHistory'])->toBe(true)
        ->and($user->preferences['anonymousAnalytics'])->toBe(true)
        ->and($user->preferences['avoidSensitiveStorage'])->toBe(false)
        ->and($user->preferences['reduceAnimations'])->toBe(false)
        ->and($user->preferences['customApiEndpoint'])->toBe('')
        ->and($user->preferences['apiKey'])->toBe('')
        ->and($user->preferences['timeoutSeconds'])->toBe(30);
});

test('preferences are cast from JSON string to array', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => 'cards', 'fontSize' => 'small'],
    ]);

    $user->save();
    $user->refresh();

    expect($user->preferences)->toBeArray()
        ->and($user->preferences['outputFormat'])->toBe('cards')
        ->and($user->preferences['fontSize'])->toBe('small');
});

test('preferences mutator encodes array to JSON in database', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $user->preferences = ['outputFormat' => 'cards', 'fontSize' => 'small'];
    $user->save();

    $user->refresh();

    expect($user->preferences)->toBeArray()
        ->and($user->preferences['outputFormat'])->toBe('cards')
        ->and($user->preferences['fontSize'])->toBe('small');
});

test('preferences attribute is fillable', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => 'table', 'jsonIndentation' => 4],
    ]);

    expect($user->preferences)->toBeArray()
        ->and($user->preferences['outputFormat'])->toBe('table')
        ->and($user->preferences['jsonIndentation'])->toBe(4);
});

test('preferences handle all valid outputFormat values', function ($format) {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => $format],
    ]);

    expect($user->preferences['outputFormat'])->toBe($format);
})->with(['json', 'table', 'cards']);

test('preferences handle all valid jsonIndentation values', function ($indentation) {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['jsonIndentation' => $indentation],
    ]);

    expect($user->preferences['jsonIndentation'])->toBe($indentation);
})->with([2, 4, 'tab']);

test('preferences handle all valid fontSize values', function ($fontSize) {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['fontSize' => $fontSize],
    ]);

    expect($user->preferences['fontSize'])->toBe($fontSize);
})->with(['small', 'medium', 'large']);

test('preferences handle boolean values correctly', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => [
            'autoCopyResults' => true,
            'showLineNumbers' => false,
            'saveToHistory' => false,
            'anonymousAnalytics' => false,
            'avoidSensitiveStorage' => true,
            'reduceAnimations' => true,
        ],
    ]);

    expect($user->preferences['autoCopyResults'])->toBe(true)
        ->and($user->preferences['showLineNumbers'])->toBe(false)
        ->and($user->preferences['saveToHistory'])->toBe(false)
        ->and($user->preferences['anonymousAnalytics'])->toBe(false)
        ->and($user->preferences['avoidSensitiveStorage'])->toBe(true)
        ->and($user->preferences['reduceAnimations'])->toBe(true);
});

test('preferences handle string values for customApiEndpoint and apiKey', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => [
            'customApiEndpoint' => 'https://api.example.com',
            'apiKey' => 'sk-test-12345',
        ],
    ]);

    expect($user->preferences['customApiEndpoint'])->toBe('https://api.example.com')
        ->and($user->preferences['apiKey'])->toBe('sk-test-12345');
});

test('preferences handle integer values for timeoutSeconds', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['timeoutSeconds' => 60],
    ]);

    expect($user->preferences['timeoutSeconds'])->toBe(60);
});

test('preferences update correctly when modified', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => 'json'],
    ]);

    $user->preferences = ['outputFormat' => 'table', 'fontSize' => 'large'];
    $user->save();
    $user->refresh();

    expect($user->preferences['outputFormat'])->toBe('table')
        ->and($user->preferences['fontSize'])->toBe('large');
});

test('preferences persist across model refresh', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => [
            'outputFormat' => 'cards',
            'fontSize' => 'large',
            'autoCopyResults' => true,
        ],
    ]);

    $userId = $user->id;
    unset($user);

    $freshUser = User::find($userId);

    expect($freshUser->preferences['outputFormat'])->toBe('cards')
        ->and($freshUser->preferences['fontSize'])->toBe('large')
        ->and($freshUser->preferences['autoCopyResults'])->toBe(true);
});

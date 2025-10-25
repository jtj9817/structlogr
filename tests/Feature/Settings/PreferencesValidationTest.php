<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('outputFormat validation rejects invalid values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['outputFormat' => 'invalid'],
    ]);

    $response->assertSessionHasErrors('preferences.outputFormat');
});

test('outputFormat validation accepts valid values', function ($format) {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['outputFormat' => $format],
    ]);

    $response->assertSessionHasNoErrors();
})->with(['json', 'table', 'cards']);

test('jsonIndentation validation rejects invalid values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['jsonIndentation' => 5],
    ]);

    $response->assertSessionHasErrors('preferences.jsonIndentation');
});

test('jsonIndentation validation accepts valid values', function ($indentation) {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['jsonIndentation' => $indentation],
    ]);

    $response->assertSessionHasNoErrors();
})->with([2, 4, 'tab']);

test('autoCopyResults validation rejects non-boolean values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['autoCopyResults' => 'yes'],
    ]);

    $response->assertSessionHasErrors('preferences.autoCopyResults');
});

test('showLineNumbers validation rejects non-boolean values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['showLineNumbers' => 'yes'],
    ]);

    $response->assertSessionHasErrors('preferences.showLineNumbers');
});

test('saveToHistory validation rejects non-boolean values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['saveToHistory' => 'true'],
    ]);

    $response->assertSessionHasErrors('preferences.saveToHistory');
});

test('anonymousAnalytics validation rejects non-boolean values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['anonymousAnalytics' => 'no'],
    ]);

    $response->assertSessionHasErrors('preferences.anonymousAnalytics');
});

test('avoidSensitiveStorage validation rejects non-boolean values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['avoidSensitiveStorage' => 'false'],
    ]);

    $response->assertSessionHasErrors('preferences.avoidSensitiveStorage');
});

test('reduceAnimations validation rejects non-boolean values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['reduceAnimations' => []],
    ]);

    $response->assertSessionHasErrors('preferences.reduceAnimations');
});

test('fontSize validation rejects invalid values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['fontSize' => 'xlarge'],
    ]);

    $response->assertSessionHasErrors('preferences.fontSize');
});

test('fontSize validation accepts valid values', function ($fontSize) {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['fontSize' => $fontSize],
    ]);

    $response->assertSessionHasNoErrors();
})->with(['small', 'medium', 'large']);

test('customApiEndpoint validation rejects non-string values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['customApiEndpoint' => 123],
    ]);

    $response->assertSessionHasErrors('preferences.customApiEndpoint');
});

test('customApiEndpoint validation enforces max length', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['customApiEndpoint' => str_repeat('a', 501)],
    ]);

    $response->assertSessionHasErrors('preferences.customApiEndpoint');
});

test('customApiEndpoint validation accepts valid strings', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['customApiEndpoint' => 'https://api.example.com'],
    ]);

    $response->assertSessionHasNoErrors();
});

test('apiKey validation rejects non-string values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['apiKey' => []],
    ]);

    $response->assertSessionHasErrors('preferences.apiKey');
});

test('apiKey validation enforces max length', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['apiKey' => str_repeat('x', 501)],
    ]);

    $response->assertSessionHasErrors('preferences.apiKey');
});

test('apiKey validation accepts valid strings', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['apiKey' => 'sk-test-12345'],
    ]);

    $response->assertSessionHasNoErrors();
});

test('timeoutSeconds validation rejects values below minimum', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['timeoutSeconds' => 4],
    ]);

    $response->assertSessionHasErrors('preferences.timeoutSeconds');
});

test('timeoutSeconds validation rejects values above maximum', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['timeoutSeconds' => 121],
    ]);

    $response->assertSessionHasErrors('preferences.timeoutSeconds');
});

test('timeoutSeconds validation accepts valid values', function ($timeout) {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['timeoutSeconds' => $timeout],
    ]);

    $response->assertSessionHasNoErrors();
})->with([5, 30, 60, 90, 120]);

test('timeoutSeconds validation rejects non-integer values', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['timeoutSeconds' => 'sixty'],
    ]);

    $response->assertSessionHasErrors('preferences.timeoutSeconds');
});

test('partial updates are valid', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['outputFormat' => 'table'],
    ]);

    $response->assertSessionHasNoErrors();
});

test('validation fails when preferences field is missing', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), []);

    $response->assertSessionHasErrors('preferences');
});

test('validation fails when preferences is empty array', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [],
    ]);

    $response->assertSessionHasErrors('preferences');
});

test('validation fails when preferences is not an array', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => 'not an array',
    ]);

    $response->assertSessionHasErrors('preferences');
});

test('validation accepts boolean true values', function ($field) {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [$field => true],
    ]);

    $response->assertSessionHasNoErrors();
})->with([
    'autoCopyResults',
    'showLineNumbers',
    'saveToHistory',
    'anonymousAnalytics',
    'avoidSensitiveStorage',
    'reduceAnimations',
]);

test('validation accepts boolean false values', function ($field) {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [$field => false],
    ]);

    $response->assertSessionHasNoErrors();
})->with([
    'autoCopyResults',
    'showLineNumbers',
    'saveToHistory',
    'anonymousAnalytics',
    'avoidSensitiveStorage',
    'reduceAnimations',
]);

test('validation fails for multiple invalid fields simultaneously', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [
            'outputFormat' => 'invalid',
            'fontSize' => 'huge',
            'timeoutSeconds' => 1000,
        ],
    ]);

    $response->assertSessionHasErrors([
        'preferences.outputFormat',
        'preferences.fontSize',
        'preferences.timeoutSeconds',
    ]);
});

test('validation accepts all valid fields together', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [
            'outputFormat' => 'json',
            'jsonIndentation' => 2,
            'autoCopyResults' => true,
            'showLineNumbers' => false,
            'saveToHistory' => true,
            'anonymousAnalytics' => false,
            'avoidSensitiveStorage' => true,
            'fontSize' => 'medium',
            'reduceAnimations' => false,
            'customApiEndpoint' => 'https://api.example.com',
            'apiKey' => 'sk-test-key',
            'timeoutSeconds' => 60,
        ],
    ]);

    $response->assertSessionHasNoErrors();
});

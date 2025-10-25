<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('authenticated user can fetch their preferences', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => 'cards', 'fontSize' => 'large'],
    ]);

    $response = $this->actingAs($user)->get(route('preferences.show'));

    $response->assertOk()
        ->assertJson([
            'preferences' => [
                'outputFormat' => 'cards',
                'fontSize' => 'large',
            ],
        ]);
});

test('fetching preferences returns all fields with defaults merged', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => 'table'],
    ]);

    $response = $this->actingAs($user)->get(route('preferences.show'));

    $response->assertOk()
        ->assertJson([
            'preferences' => [
                'outputFormat' => 'table',
                'jsonIndentation' => 2,
                'autoCopyResults' => false,
                'showLineNumbers' => true,
                'saveToHistory' => true,
                'anonymousAnalytics' => true,
                'avoidSensitiveStorage' => false,
                'fontSize' => 'medium',
                'reduceAnimations' => false,
                'customApiEndpoint' => '',
                'apiKey' => '',
                'timeoutSeconds' => 30,
            ],
        ]);
});

test('fetching preferences requires authentication', function () {
    $response = $this->get(route('preferences.show'));

    $response->assertRedirect(route('login'));
});

test('authenticated user can update their preferences', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [
            'outputFormat' => 'table',
            'fontSize' => 'large',
        ],
    ]);

    $response->assertOk()
        ->assertJson([
            'message' => 'Preferences updated successfully',
            'preferences' => [
                'outputFormat' => 'table',
                'fontSize' => 'large',
            ],
        ]);

    $user->refresh();

    expect($user->preferences['outputFormat'])->toBe('table')
        ->and($user->preferences['fontSize'])->toBe('large');
});

test('updating preferences merges with existing preferences', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => [
            'outputFormat' => 'json',
            'fontSize' => 'small',
            'autoCopyResults' => true,
        ],
    ]);

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [
            'outputFormat' => 'table',
        ],
    ]);

    $response->assertOk();

    $user->refresh();

    expect($user->preferences['outputFormat'])->toBe('table')
        ->and($user->preferences['fontSize'])->toBe('small')
        ->and($user->preferences['autoCopyResults'])->toBe(true);
});

test('updating preferences requires authentication', function () {
    $response = $this->patch(route('preferences.update'), [
        'preferences' => [
            'outputFormat' => 'table',
        ],
    ]);

    $response->assertRedirect(route('login'));
});

test('preferences persist across sessions', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [
            'outputFormat' => 'cards',
            'fontSize' => 'large',
            'autoCopyResults' => true,
        ],
    ]);

    $this->post(route('logout'));

    $response = $this->actingAs($user)->get(route('preferences.show'));

    $response->assertOk()
        ->assertJson([
            'preferences' => [
                'outputFormat' => 'cards',
                'fontSize' => 'large',
                'autoCopyResults' => true,
            ],
        ]);
});

test('validation fails when preferences field is missing', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), []);

    $response->assertSessionHasErrors(['preferences']);
});

test('validation fails when preferences is empty array', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [],
    ]);

    $response->assertSessionHasErrors(['preferences']);
});

test('updating preferences returns updated values in response', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [
            'outputFormat' => 'table',
            'jsonIndentation' => 4,
            'fontSize' => 'large',
        ],
    ]);

    $response->assertOk()
        ->assertJson([
            'preferences' => [
                'outputFormat' => 'table',
                'jsonIndentation' => 4,
                'fontSize' => 'large',
            ],
        ]);
});

test('multiple preference updates are applied correctly', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['outputFormat' => 'json'],
    ]);

    $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['fontSize' => 'small'],
    ]);

    $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['autoCopyResults' => true],
    ]);

    $user->refresh();

    expect($user->preferences['outputFormat'])->toBe('json')
        ->and($user->preferences['fontSize'])->toBe('small')
        ->and($user->preferences['autoCopyResults'])->toBe(true);
});

test('updating all preference fields works correctly', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => [
            'outputFormat' => 'cards',
            'jsonIndentation' => 4,
            'autoCopyResults' => true,
            'showLineNumbers' => false,
            'saveToHistory' => false,
            'anonymousAnalytics' => false,
            'avoidSensitiveStorage' => true,
            'fontSize' => 'large',
            'reduceAnimations' => true,
            'customApiEndpoint' => 'https://api.example.com',
            'apiKey' => 'sk-test-12345',
            'timeoutSeconds' => 60,
        ],
    ]);

    $response->assertOk();

    $user->refresh();

    expect($user->preferences['outputFormat'])->toBe('cards')
        ->and($user->preferences['jsonIndentation'])->toBe(4)
        ->and($user->preferences['autoCopyResults'])->toBe(true)
        ->and($user->preferences['showLineNumbers'])->toBe(false)
        ->and($user->preferences['saveToHistory'])->toBe(false)
        ->and($user->preferences['anonymousAnalytics'])->toBe(false)
        ->and($user->preferences['avoidSensitiveStorage'])->toBe(true)
        ->and($user->preferences['fontSize'])->toBe('large')
        ->and($user->preferences['reduceAnimations'])->toBe(true)
        ->and($user->preferences['customApiEndpoint'])->toBe('https://api.example.com')
        ->and($user->preferences['apiKey'])->toBe('sk-test-12345')
        ->and($user->preferences['timeoutSeconds'])->toBe(60);
});

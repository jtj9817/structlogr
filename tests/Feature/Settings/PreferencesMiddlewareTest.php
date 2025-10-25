<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('authenticated user has preferences in inertia shared data', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => 'cards', 'fontSize' => 'large'],
    ]);

    $response = $this->actingAs($user)->get('/');

    $response->assertInertia(fn (Assert $page) => $page
        ->has('auth.user.preferences')
        ->where('auth.user.preferences.outputFormat', 'cards')
        ->where('auth.user.preferences.fontSize', 'large')
    );
});

test('guest user has null auth user in inertia shared data', function () {
    $response = $this->get('/');

    $response->assertInertia(fn (Assert $page) => $page
        ->where('auth.user', null)
    );
});

test('preferences updated in real-time after patch', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => 'json', 'fontSize' => 'small'],
    ]);

    $response = $this->actingAs($user)->get('/');

    $response->assertInertia(fn (Assert $page) => $page
        ->where('auth.user.preferences.outputFormat', 'json')
        ->where('auth.user.preferences.fontSize', 'small')
    );

    $this->actingAs($user)->patch(route('preferences.update'), [
        'preferences' => ['outputFormat' => 'table', 'fontSize' => 'large'],
    ]);

    $response = $this->actingAs($user)->get('/');

    $response->assertInertia(fn (Assert $page) => $page
        ->where('auth.user.preferences.outputFormat', 'table')
        ->where('auth.user.preferences.fontSize', 'large')
    );
});

test('all preference fields present in inertia shared data', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => [
            'outputFormat' => 'cards',
            'jsonIndentation' => 4,
            'autoCopyResults' => true,
            'showLineNumbers' => false,
            'saveToHistory' => true,
            'anonymousAnalytics' => false,
            'avoidSensitiveStorage' => true,
            'fontSize' => 'large',
            'reduceAnimations' => false,
            'customApiEndpoint' => 'https://api.example.com',
            'apiKey' => 'sk-test-12345',
            'timeoutSeconds' => 60,
        ],
    ]);

    $response = $this->actingAs($user)->get('/');

    $response->assertInertia(fn (Assert $page) => $page
        ->has('auth.user.preferences.outputFormat')
        ->has('auth.user.preferences.jsonIndentation')
        ->has('auth.user.preferences.autoCopyResults')
        ->has('auth.user.preferences.showLineNumbers')
        ->has('auth.user.preferences.saveToHistory')
        ->has('auth.user.preferences.anonymousAnalytics')
        ->has('auth.user.preferences.avoidSensitiveStorage')
        ->has('auth.user.preferences.fontSize')
        ->has('auth.user.preferences.reduceAnimations')
        ->has('auth.user.preferences.customApiEndpoint')
        ->has('auth.user.preferences.apiKey')
        ->has('auth.user.preferences.timeoutSeconds')
        ->where('auth.user.preferences.outputFormat', 'cards')
        ->where('auth.user.preferences.jsonIndentation', 4)
        ->where('auth.user.preferences.autoCopyResults', true)
        ->where('auth.user.preferences.showLineNumbers', false)
        ->where('auth.user.preferences.saveToHistory', true)
        ->where('auth.user.preferences.anonymousAnalytics', false)
        ->where('auth.user.preferences.avoidSensitiveStorage', true)
        ->where('auth.user.preferences.fontSize', 'large')
        ->where('auth.user.preferences.reduceAnimations', false)
        ->where('auth.user.preferences.customApiEndpoint', 'https://api.example.com')
        ->where('auth.user.preferences.apiKey', 'sk-test-12345')
        ->where('auth.user.preferences.timeoutSeconds', 60)
    );
});

test('defaults applied when user has null preferences', function () {
    $user = User::factory()->withoutTwoFactor()->create(['preferences' => null]);

    $response = $this->actingAs($user)->get('/');

    $response->assertInertia(fn (Assert $page) => $page
        ->has('auth.user.preferences')
        ->where('auth.user.preferences.outputFormat', 'json')
        ->where('auth.user.preferences.jsonIndentation', 2)
        ->where('auth.user.preferences.autoCopyResults', false)
        ->where('auth.user.preferences.showLineNumbers', true)
        ->where('auth.user.preferences.saveToHistory', true)
        ->where('auth.user.preferences.anonymousAnalytics', true)
        ->where('auth.user.preferences.avoidSensitiveStorage', false)
        ->where('auth.user.preferences.fontSize', 'medium')
        ->where('auth.user.preferences.reduceAnimations', false)
        ->where('auth.user.preferences.customApiEndpoint', '')
        ->where('auth.user.preferences.apiKey', '')
        ->where('auth.user.preferences.timeoutSeconds', 30)
    );
});

test('defaults merged with partial preferences in inertia shared data', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => 'table', 'fontSize' => 'small'],
    ]);

    $response = $this->actingAs($user)->get('/');

    $response->assertInertia(fn (Assert $page) => $page
        ->where('auth.user.preferences.outputFormat', 'table')
        ->where('auth.user.preferences.fontSize', 'small')
        ->where('auth.user.preferences.jsonIndentation', 2)
        ->where('auth.user.preferences.autoCopyResults', false)
    );
});

test('preferences shared data updates immediately after user model change', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => 'json'],
    ]);

    $user->preferences = ['outputFormat' => 'cards', 'fontSize' => 'large'];
    $user->save();

    $response = $this->actingAs($user)->get('/');

    $response->assertInertia(fn (Assert $page) => $page
        ->where('auth.user.preferences.outputFormat', 'cards')
        ->where('auth.user.preferences.fontSize', 'large')
    );
});

test('preferences are accessible on all authenticated routes', function ($route) {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => ['outputFormat' => 'cards'],
    ]);

    $response = $this->actingAs($user)->get(route($route));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('auth.user.preferences')
        ->where('auth.user.preferences.outputFormat', 'cards')
    );
})->with([
    'profile.edit',
    'password.edit',
    'appearance.edit',
]);

test('preferences contain all default fields even when user preferences is empty string', function () {
    $user = User::factory()->withoutTwoFactor()->create(['preferences' => '']);

    $response = $this->actingAs($user)->get('/');

    $response->assertInertia(fn (Assert $page) => $page
        ->has('auth.user.preferences')
        ->where('auth.user.preferences.outputFormat', 'json')
        ->where('auth.user.preferences.jsonIndentation', 2)
        ->where('auth.user.preferences.autoCopyResults', false)
        ->where('auth.user.preferences.showLineNumbers', true)
        ->where('auth.user.preferences.saveToHistory', true)
        ->where('auth.user.preferences.anonymousAnalytics', true)
        ->where('auth.user.preferences.avoidSensitiveStorage', false)
        ->where('auth.user.preferences.fontSize', 'medium')
        ->where('auth.user.preferences.reduceAnimations', false)
        ->where('auth.user.preferences.customApiEndpoint', '')
        ->where('auth.user.preferences.apiKey', '')
        ->where('auth.user.preferences.timeoutSeconds', 30)
    );
});

test('preferences in shared data match preferences fetched via api', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'preferences' => [
            'outputFormat' => 'table',
            'fontSize' => 'large',
            'autoCopyResults' => true,
        ],
    ]);

    $inertiaResponse = $this->actingAs($user)->get('/');
    $apiResponse = $this->actingAs($user)->get(route('preferences.show'));

    $apiPreferences = $apiResponse->json('preferences');

    $inertiaResponse->assertInertia(fn (Assert $page) => $page
        ->where('auth.user.preferences.outputFormat', $apiPreferences['outputFormat'])
        ->where('auth.user.preferences.fontSize', $apiPreferences['fontSize'])
        ->where('auth.user.preferences.autoCopyResults', $apiPreferences['autoCopyResults'])
        ->where('auth.user.preferences.jsonIndentation', $apiPreferences['jsonIndentation'])
    );
});

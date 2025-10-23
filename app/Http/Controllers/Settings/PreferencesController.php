<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PreferencesController extends Controller
{
    public function show()
    {
        $user = Auth::user();

        return response()->json([
            'preferences' => $user->preferences,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.outputFormat' => [
                'sometimes',
                'string',
                Rule::in(['json', 'table', 'cards']),
            ],
            'preferences.jsonIndentation' => [
                'sometimes',
                Rule::in([2, 4, 'tab']),
            ],
            'preferences.autoCopyResults' => 'sometimes|boolean',
            'preferences.showLineNumbers' => 'sometimes|boolean',
            'preferences.saveToHistory' => 'sometimes|boolean',
            'preferences.anonymousAnalytics' => 'sometimes|boolean',
            'preferences.avoidSensitiveStorage' => 'sometimes|boolean',
            'preferences.fontSize' => [
                'sometimes',
                'string',
                Rule::in(['small', 'medium', 'large']),
            ],
            'preferences.reduceAnimations' => 'sometimes|boolean',
            'preferences.customApiEndpoint' => 'sometimes|string|max:500',
            'preferences.apiKey' => 'sometimes|string|max:500',
            'preferences.timeoutSeconds' => 'sometimes|integer|min:5|max:120',
        ]);

        $user = Auth::user();

        $currentPreferences = $user->preferences;
        $updatedPreferences = array_merge($currentPreferences, $validated['preferences']);

        $user->preferences = $updatedPreferences;
        $user->save();

        return response()->json([
            'message' => 'Preferences updated successfully',
            'preferences' => $user->preferences,
        ]);
    }
}

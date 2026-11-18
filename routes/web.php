<?php

use App\Http\Controllers\HistoryController;
use App\Http\Controllers\LogFormatterController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LogFormatterController::class, 'show'])->name('home');
Route::post('/format', [LogFormatterController::class, 'format'])->name('formatter.format');

// CSRF test routes for debugging and validation
Route::prefix('debug')->middleware('web')->group(function () {
    Route::get('/csrf-status', function () {
        return response()->json([
            'csrf_token' => csrf_token(),
            'session_id' => session()->getId(),
            'session_encrypted' => config('session.encrypt'),
            'session_lifetime' => config('session.lifetime'),
            'token_source' => 'meta_tag',
            'timestamp' => now()->toIso8601String(),
            'app_env' => config('app.env'),
        ]);
    })->name('debug.csrf-status');

    Route::post('/csrf-test', function (\Illuminate\Http\Request $request) {
        return response()->json([
            'message' => 'CSRF token validation successful',
            'token_valid' => true,
            'request_headers' => [
                'has_csrf_header' => $request->headers->has('X-CSRF-TOKEN'),
                'has_x_requested_with' => $request->headers->has('X-Requested-With'),
                'content_type' => $request->headers->get('Content-Type'),
            ],
            'session_data' => [
                'id' => session()->getId(),
                'encrypted' => config('session.encrypt'),
                'cookie' => config('session.cookie'),
            ],
            'token_info' => [
                'length' => strlen(csrf_token()),
                'preview' => substr(csrf_token(), 0, 10) . '...',
            ],
        ]);
    })->name('debug.csrf-test');

    Route::get('/session-info', function () {
        return response()->json([
            'session_id' => session()->getId(),
            'session_encrypted' => config('session.encrypt'),
            'session_driver' => config('session.driver'),
            'session_lifetime' => config('session.lifetime'),
            'session_cookie' => config('session.cookie'),
            'session_domain' => config('session.domain'),
            'session_secure' => config('session.secure'),
            'session_same_site' => config('session.same_site'),
            'cookies' => [
                'appearance' => request()->cookie('appearance'),
                'sidebar_state' => request()->cookie('sidebar_state'),
            ],
        ]);
    })->name('debug.session-info');
});

Route::middleware('auth')->prefix('history')->name('history.')->group(function () {
    Route::get('/', [HistoryController::class, 'index'])->name('index');
    Route::get('/search', [HistoryController::class, 'search'])->name('search');
    Route::get('/export', [HistoryController::class, 'export'])->name('export');
    Route::get('/{formattedLog}', [HistoryController::class, 'show'])->name('show');
    Route::patch('/{formattedLog}/toggle-save', [HistoryController::class, 'toggleSave'])->name('toggle-save');
    Route::delete('/{formattedLog}', [HistoryController::class, 'destroy'])->name('destroy');
    Route::delete('/', [HistoryController::class, 'clear'])->name('clear');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

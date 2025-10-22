<?php

use App\Http\Controllers\HistoryController;
use App\Http\Controllers\LogFormatterController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [LogFormatterController::class, 'show'])->name('formatter.show');
Route::post('/format', [LogFormatterController::class, 'format'])->name('formatter.format');

Route::middleware('auth')->prefix('history')->name('history.')->group(function () {
    Route::get('/', [HistoryController::class, 'index'])->name('index');
    Route::get('/export', [HistoryController::class, 'export'])->name('export');
    Route::get('/{formattedLog}', [HistoryController::class, 'show'])->name('show');
    Route::patch('/{formattedLog}/toggle-save', [HistoryController::class, 'toggleSave'])->name('toggle-save');
    Route::delete('/{formattedLog}', [HistoryController::class, 'destroy'])->name('destroy');
    Route::delete('/', [HistoryController::class, 'clear'])->name('clear');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

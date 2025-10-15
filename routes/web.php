<?php

use App\Http\Controllers\LogFormatterController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [LogFormatterController::class, 'show'])->name('formatter.show');
Route::post('/format', [LogFormatterController::class, 'format'])->name('formatter.format');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\TestController;

Route::get('/health', function () {
    return response()->json(['status' => 'API is healthy', 'service' => 'Laravel']);
});

Route::get('/dashboard', [TestController::class, 'dashboard']);
Route::post('/client', [TestController::class, 'createClient']);

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\QueueController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Clinic queue routes
    Route::post('/queues', [QueueController::class, 'store']);
    Route::get('/queues', [QueueController::class, 'index']);
    Route::patch('/queues/{queue}', [QueueController::class, 'update']);
});
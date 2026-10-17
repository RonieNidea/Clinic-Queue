<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicVisitController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\StaffVisitController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/available-slots', [AppointmentController::class, 'availableSlots']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::patch('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/visits', [ClinicVisitController::class, 'index']);
    Route::patch('/visits/{visit}/review', [ClinicVisitController::class, 'review']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Clinic queue routes
    Route::post('/queues', [QueueController::class, 'store']);
    Route::get('/queues', [QueueController::class, 'index']);
    Route::patch('/queues/{queue}', [QueueController::class, 'update'])->middleware('staff');

    Route::middleware('staff')->prefix('staff')->group(function () {
        Route::get('/students', [StaffVisitController::class, 'searchStudents']);
        Route::get('/visits', [StaffVisitController::class, 'visits']);
        Route::get('/students/{user}/visits', [StaffVisitController::class, 'studentVisits']);
        Route::post('/visits', [StaffVisitController::class, 'store']);
        Route::get('/slot-blocks', [StaffVisitController::class, 'slotBlocks']);
        Route::post('/slot-blocks', [StaffVisitController::class, 'storeSlotBlock']);
        Route::delete('/slot-blocks/{block}', [StaffVisitController::class, 'deleteSlotBlock']);
    });
});

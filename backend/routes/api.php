<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MotifController;
use App\Http\Controllers\Api\OperationController;
use App\Http\Controllers\Api\BalanceController;
use App\Http\Controllers\Api\UserController; // Import the new controller
use App\Http\Controllers\Api\CaisseController; // Import CaisseController

Route::get('/caisses', [CaisseController::class, 'index']);
Route::post('/caisses', [CaisseController::class, 'store']);



Route::post('/login', [AuthController::class, 'login']);

Route::get('/motifs', [MotifController::class, 'index']);
Route::post('/motifs', [MotifController::class, 'store']);

Route::get('/operations', [OperationController::class, 'index']);
Route::post('/operations', [OperationController::class, 'store']);
Route::put('/operations/{id}', [OperationController::class, 'update']);
Route::delete('/operations/{id}', [OperationController::class, 'destroy']);

Route::get('/balance', [BalanceController::class, 'get']);
Route::get('/balance/stats', [BalanceController::class, 'stats']);

// New User Routes
Route::apiResource('users', UserController::class);

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\NotificationController;


Route::middleware('auth:sanctum')->get('/notifications', function (Request $request) {
    return $request->user()->notifications;
});

Route::middleware('auth:sanctum')->post('/buy-item', [OrderController::class, 'store']);

// Routes for authenticated users
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/items', [ItemController::class, 'index']);
    Route::post('/items', [ItemController::class, 'store']);
    Route::get('/items-for-sale', [ItemController::class, 'getItemsForSale']);
    Route::put('/items/{id}', [ItemController::class, 'update']); // Update item route protected by auth
    Route::delete('/items/{id}', [ItemController::class, 'destroy']); // Delete item route protected by auth
    Route::post('/orders/{order}/accept', [OrderController::class, 'accept']);

});
Route::middleware('auth:sanctum')->get('/my-orders', [OrderController::class, 'myOrders']);
    Route::post('/orders/{order}/decline', [OrderController::class, 'decline']);
   
    Route::middleware('auth:sanctum')->group(function () {
    Route::post('/notifications/{id}/accept', [NotificationController::class, 'accept']);
    Route::post('/notifications/{id}/decline', [NotificationController::class, 'decline']);
});



// Routes for user registration and login (public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

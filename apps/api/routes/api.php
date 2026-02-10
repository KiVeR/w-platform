<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CampaignsController;
use App\Http\Controllers\Api\InterestGroupsController;
use App\Http\Controllers\Api\LandingPagesController;
use App\Http\Controllers\Api\PartnerPricingsController;
use App\Http\Controllers\Api\PartnersController;
use App\Http\Controllers\Api\ShopsController;
use App\Http\Controllers\Api\UsersController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => (string) config('app.name'),
    'version' => '1.0.0',
]));

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/social/login', [AuthController::class, 'socialLogin']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

Route::middleware(['auth:api', 'active'])->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::apiResource('partners', PartnersController::class);
    Route::apiResource('shops', ShopsController::class);
    Route::apiResource('users', UsersController::class);

    Route::get('interest-groups', [InterestGroupsController::class, 'index']);
    Route::apiResource('partner-pricings', PartnerPricingsController::class);
    Route::apiResource('campaigns', CampaignsController::class);
    Route::post('campaigns/{campaign}/estimate', [CampaignsController::class, 'estimate']);
    Route::post('campaigns/{campaign}/schedule', [CampaignsController::class, 'schedule']);
    Route::post('campaigns/{campaign}/send', [CampaignsController::class, 'send']);
    Route::post('campaigns/{campaign}/cancel', [CampaignsController::class, 'cancel']);
    Route::get('campaigns/{campaign}/stats', [CampaignsController::class, 'stats']);
    Route::get('campaigns/{campaign}/export', [CampaignsController::class, 'export']);

    Route::apiResource('landing-pages', LandingPagesController::class);
    Route::get('landing-pages/{landing_page}/design', [LandingPagesController::class, 'design']);
    Route::put('landing-pages/{landing_page}/design', [LandingPagesController::class, 'saveDesign']);

    Route::get('landing-pages/{landing_page}/variable-schema', [LandingPagesController::class, 'variableSchema']);
    Route::post('landing-pages/{landing_page}/variable-schema', [LandingPagesController::class, 'attachVariableSchema']);
    Route::delete('landing-pages/{landing_page}/variable-schema', [LandingPagesController::class, 'detachVariableSchema']);
});

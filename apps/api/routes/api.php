<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AIContentController;
use App\Http\Controllers\Api\AIGenerationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CampaignsController;
use App\Http\Controllers\Api\EstimateController;
use App\Http\Controllers\Api\ExternalCampaignController;
use App\Http\Controllers\Api\GeoController;
use App\Http\Controllers\Api\ImportableLinkController;
use App\Http\Controllers\Api\InterestGroupsController;
use App\Http\Controllers\Api\IrisZonesController;
use App\Http\Controllers\Api\LandingPagesController;
use App\Http\Controllers\Api\PartnerPricingsController;
use App\Http\Controllers\Api\PartnersController;
use App\Http\Controllers\Api\ShopsController;
use App\Http\Controllers\Api\ShortUrlController;
use App\Http\Controllers\Api\ShortUrlSuffixRequestController;
use App\Http\Controllers\Api\SmsWebhookController;
use App\Http\Controllers\Api\TargetingTemplatesController;
use App\Http\Controllers\Api\UsersController;
use App\Http\Controllers\Api\VariableSchemaController;
use Illuminate\Support\Facades\Route;

// External API — Client Credentials OAuth2 (machine-to-machine, e.g. Wepak PUSH)
Route::middleware(['client'])->prefix('external')->group(function (): void {
    Route::post('campaigns', [ExternalCampaignController::class, 'store']);
});

// SMS provider webhooks — public, no auth
Route::prefix('webhooks')->group(function (): void {
    Route::post('sinch', [SmsWebhookController::class, 'sinch']);
    Route::post('infobip', [SmsWebhookController::class, 'infobip']);
    Route::post('highconnexion', [SmsWebhookController::class, 'highconnexion']);
});

Route::get('/', fn () => response()->json([
    'name' => (string) config('app.name'),
    'version' => '1.0.0',
]));

Route::prefix('auth')->middleware('throttle:auth')->group(function (): void {
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
    Route::post('estimate', EstimateController::class);
    Route::apiResource('campaigns', CampaignsController::class);
    Route::post('campaigns/{campaign}/schedule', [CampaignsController::class, 'schedule']);
    Route::post('campaigns/{campaign}/send', [CampaignsController::class, 'send']);
    Route::post('campaigns/{campaign}/cancel', [CampaignsController::class, 'cancel']);
    Route::get('campaigns/{campaign}/stats', [CampaignsController::class, 'stats']);
    Route::get('campaigns/{campaign}/export', [CampaignsController::class, 'export']);

    Route::apiResource('targeting-templates', TargetingTemplatesController::class);
    Route::post('targeting-templates/{targeting_template}/use', [TargetingTemplatesController::class, 'useTemplate']);

    Route::apiResource('landing-pages', LandingPagesController::class);
    Route::get('landing-pages/{landing_page}/design', [LandingPagesController::class, 'design']);
    Route::put('landing-pages/{landing_page}/design', [LandingPagesController::class, 'saveDesign']);

    Route::get('landing-pages/{landing_page}/variable-schema', [LandingPagesController::class, 'variableSchema']);
    Route::post('landing-pages/{landing_page}/variable-schema', [LandingPagesController::class, 'attachVariableSchema']);
    Route::delete('landing-pages/{landing_page}/variable-schema', [LandingPagesController::class, 'detachVariableSchema']);

    Route::post('variable-schemas/discover', [VariableSchemaController::class, 'discover']);
    Route::post('variable-schemas/preview', [VariableSchemaController::class, 'preview']);
    Route::apiResource('variable-schemas', VariableSchemaController::class)
        ->parameters(['variable-schemas' => 'variableSchema']);
    Route::post('variable-schemas/{variableSchema}/clone', [VariableSchemaController::class, 'clone']);
    Route::post('variable-schemas/{variableSchema}/mark-used', [VariableSchemaController::class, 'markUsed']);
    Route::post('variable-schemas/{variableSchema}/mark-unused', [VariableSchemaController::class, 'markUnused']);

    Route::apiResource('short-urls', ShortUrlController::class);
    Route::post('short-urls/list', [ShortUrlController::class, 'index']);
    Route::post('short-url-requests', [ShortUrlSuffixRequestController::class, 'store']);
    Route::delete('short-url-requests', [ShortUrlSuffixRequestController::class, 'destroy']);
    Route::post('importable-links/upload', [ImportableLinkController::class, 'upload']);
    Route::post('importable-links/import/{uuid}', [ImportableLinkController::class, 'import']);

    Route::prefix('geo')->name('geo.')->group(function (): void {
        Route::get('departments', [GeoController::class, 'departments'])->name('departments.index');
        Route::get('departments/{code}', [GeoController::class, 'showDepartment'])->name('departments.show');
        Route::get('departments/{code}/geometry', [GeoController::class, 'departmentGeometry'])->name('departments.geometry');

        Route::get('regions', [GeoController::class, 'regions'])->name('regions.index');
        Route::get('regions/{code}', [GeoController::class, 'showRegion'])->name('regions.show');
        Route::get('regions/{code}/geometry', [GeoController::class, 'regionGeometry'])->name('regions.geometry');

        Route::get('communes', [GeoController::class, 'communes'])->name('communes.index');
        Route::get('communes/{code}', [GeoController::class, 'showCommune'])->name('communes.show');

        Route::get('iris-zones', [IrisZonesController::class, 'index'])->name('iris-zones.index');
        Route::get('iris-zones/{code}', [IrisZonesController::class, 'show'])->name('iris-zones.show');
        Route::get('iris-zones/{code}/geometry', [IrisZonesController::class, 'geometry'])->name('iris-zones.geometry');
        Route::post('iris-zones/lookup', [IrisZonesController::class, 'lookup'])->name('iris-zones.lookup');
        Route::post('iris-zones/batch', [IrisZonesController::class, 'batch'])->name('iris-zones.batch');
    });

    Route::prefix('ai')->group(function (): void {
        Route::post('generate', [AIGenerationController::class, 'generate']);
        Route::get('generate/{jobId}/status', [AIGenerationController::class, 'status']);

        Route::get('contents/recent', [AIContentController::class, 'recent']);
        Route::apiResource('contents', AIContentController::class)->except(['edit', 'create'])->parameters(['contents' => 'aiContent']);
        Route::post('contents/{aiContent}/favorite', [AIContentController::class, 'favorite']);
        Route::get('contents/{aiContent}/design', [AIContentController::class, 'design']);
        Route::put('contents/{aiContent}/design', [AIContentController::class, 'saveDesign']);
        Route::get('contents/{aiContent}/versions', [AIContentController::class, 'versions']);
        Route::get('contents/{aiContent}/versions/{version}', [AIContentController::class, 'showVersion']);
        Route::post('contents/{aiContent}/versions', [AIContentController::class, 'restoreVersion'])->middleware('throttle:restore-version');
    });
});

<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AIContentController;
use App\Http\Controllers\Api\AIContentDesignController;
use App\Http\Controllers\Api\AIContentVersionController;
use App\Http\Controllers\Api\AIGenerationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BroadcastingAuthController;
use App\Http\Controllers\Api\CampaignActivitiesController;
use App\Http\Controllers\Api\CampaignLogsController;
use App\Http\Controllers\Api\CampaignRecipientsController;
use App\Http\Controllers\Api\CampaignPullReportController;
use App\Http\Controllers\Api\CampaignRoutingController;
use App\Http\Controllers\Api\CampaignsController;
use App\Http\Controllers\Api\DemandesController;
use App\Http\Controllers\Api\EstimateController;
use App\Http\Controllers\Api\ExternalCampaignController;
use App\Http\Controllers\Api\GeoController;
use App\Http\Controllers\Api\ImportableLinkController;
use App\Http\Controllers\Api\InterestGroupsController;
use App\Http\Controllers\Api\InternalVariableSchemaController;
use App\Http\Controllers\Api\InvoicesController;
use App\Http\Controllers\Api\IrisZonesController;
use App\Http\Controllers\Api\LandingPagesController;
use App\Http\Controllers\Api\OperationsController;
use App\Http\Controllers\Api\PartnerCreditsController;
use App\Http\Controllers\Api\PartnerFeaturesController;
use App\Http\Controllers\Api\PartnerPricingsController;
use App\Http\Controllers\Api\PartnersController;
use App\Http\Controllers\Api\RouterController;
use App\Http\Controllers\Api\ShopsController;
use App\Http\Controllers\Api\ShortUrlController;
use App\Http\Controllers\Api\ShortUrlSuffixRequestController;
use App\Http\Controllers\Api\SmsWebhookController;
use App\Http\Controllers\Api\TargetingTemplatesController;
use App\Http\Controllers\Api\TransactionsController;
use App\Http\Controllers\Api\UsersController;
use App\Http\Controllers\Api\VariableSchemaController;
use Illuminate\Support\Facades\Route;

// External API — Client Credentials OAuth2 (machine-to-machine, e.g. Wepak PUSH)
Route::middleware(['client'])->prefix('external')->group(function (): void {
    Route::post('campaigns', [ExternalCampaignController::class, 'store']);
});

Route::middleware(['client'])->prefix('internal')->group(function (): void {
    Route::get('variable-schemas', [InternalVariableSchemaController::class, 'index']);
    Route::get('variable-schemas/{variableSchema}', [InternalVariableSchemaController::class, 'show']);
    Route::post('variable-schemas/{variableSchema}/mark-used', [InternalVariableSchemaController::class, 'markUsed']);
    Route::post('variable-schemas/{variableSchema}/mark-unused', [InternalVariableSchemaController::class, 'markUnused']);
});

// SMS provider webhooks — public, no auth
Route::prefix('webhooks')->middleware('throttle:webhooks')->group(function (): void {
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
    Route::post('broadcasting/auth', BroadcastingAuthController::class);

    Route::prefix('auth')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::apiResource('partners', PartnersController::class);
    Route::apiResource('routers', RouterController::class)->except(['show']);
    Route::apiResource('shops', ShopsController::class);
    Route::apiResource('users', UsersController::class);

    Route::get('interest-groups', [InterestGroupsController::class, 'index']);
    Route::apiResource('partner-pricings', PartnerPricingsController::class);
    Route::post('estimate', EstimateController::class);
    Route::post('campaigns', [CampaignsController::class, 'store'])->middleware('deprecate:2026-09-01');
    Route::apiResource('campaigns', CampaignsController::class)->except(['store']);
    Route::post('campaigns/{campaign}/schedule', [CampaignsController::class, 'schedule'])
        ->middleware('throttle:campaign-actions');
    Route::post('campaigns/{campaign}/send', [CampaignsController::class, 'send'])
        ->middleware('throttle:campaign-actions');
    Route::post('campaigns/{campaign}/cancel', [CampaignsController::class, 'cancel'])
        ->middleware('throttle:campaign-actions');
    Route::get('campaigns/{campaign}/stats', [CampaignsController::class, 'stats']);
    Route::get('campaigns/{campaign}/export', [CampaignsController::class, 'export']);
    Route::get('campaigns/{campaign}/activities', [CampaignActivitiesController::class, 'index']);
    Route::get('campaigns/{campaign}/logs', [CampaignLogsController::class, 'index']);
    Route::get('campaigns/{campaign}/recipients', [CampaignRecipientsController::class, 'index']);
    Route::post('campaigns/{campaign}/routing/start', [CampaignRoutingController::class, 'start'])
        ->middleware('throttle:campaign-actions');
    Route::post('campaigns/{campaign}/routing/pause', [CampaignRoutingController::class, 'pause'])
        ->middleware('throttle:campaign-actions');
    Route::post('campaigns/{campaign}/routing/cancel', [CampaignRoutingController::class, 'cancel'])
        ->middleware('throttle:campaign-actions');
    Route::post('campaigns/{campaign}/pull-report', CampaignPullReportController::class)
        ->middleware('throttle:campaign-actions');

    Route::apiResource('demandes', DemandesController::class);
    Route::apiResource('operations', OperationsController::class);
    Route::post('operations/{operation}/transition', [OperationsController::class, 'transition']);
    Route::get('operations/{operation}/transitions', [OperationsController::class, 'transitions']);

    Route::apiResource('targeting-templates', TargetingTemplatesController::class);
    Route::post('targeting-templates/{targeting_template}/use', [TargetingTemplatesController::class, 'useTemplate']);

    Route::apiResource('landing-pages', LandingPagesController::class);
    Route::get('landing-pages/{landing_page}/design', [LandingPagesController::class, 'design']);
    Route::put('landing-pages/{landing_page}/design', [LandingPagesController::class, 'saveDesign']);

    Route::get('landing-pages/{landing_page}/variable-schema', [LandingPagesController::class, 'variableSchema']);
    Route::post('landing-pages/{landing_page}/variable-schema', [LandingPagesController::class, 'attachVariableSchema']);
    Route::delete('landing-pages/{landing_page}/variable-schema', [LandingPagesController::class, 'detachVariableSchema']);

    Route::apiResource('variable-schemas', VariableSchemaController::class)
        ->parameters(['variable-schemas' => 'variableSchema']);
    Route::post('variable-schemas/{variableSchema}/clone', [VariableSchemaController::class, 'clone']);

    Route::apiResource('short-urls', ShortUrlController::class);
    Route::post('short-urls/list', [ShortUrlController::class, 'index']);
    Route::post('short-url-requests', [ShortUrlSuffixRequestController::class, 'store']);
    Route::delete('short-url-requests', [ShortUrlSuffixRequestController::class, 'destroy']);
    Route::post('importable-links/upload', [ImportableLinkController::class, 'upload']);
    Route::post('importable-links/import/{uuid}', [ImportableLinkController::class, 'import']);

    Route::apiResource('invoices', InvoicesController::class)->only(['index', 'show']);
    Route::get('partners/{partner}/balance', [TransactionsController::class, 'balance']);
    Route::get('partners/{partner}/transactions', [TransactionsController::class, 'index']);
    Route::post('partners/{partner}/credits', [PartnerCreditsController::class, 'store']);
    Route::get('partners/{partner}/features', [PartnerFeaturesController::class, 'index']);
    Route::put('partners/{partner}/features/{feature}', [PartnerFeaturesController::class, 'update']);

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
        Route::get('quota', [AIGenerationController::class, 'quota']);
        Route::post('generate', [AIGenerationController::class, 'generate']);
        Route::get('generate/{jobId}/status', [AIGenerationController::class, 'status']);

        Route::get('contents/recent', [AIContentController::class, 'recent']);
        Route::post('contents', [AIContentController::class, 'store'])->middleware('throttle:ai-content-create');
        Route::apiResource('contents', AIContentController::class)->except(['edit', 'create', 'store'])->parameters(['contents' => 'aiContent']);
        Route::post('contents/{aiContent}/favorite', [AIContentController::class, 'favorite']);
        Route::get('contents/{aiContent}/design', [AIContentDesignController::class, 'show']);
        Route::put('contents/{aiContent}/design', [AIContentDesignController::class, 'update'])->middleware('throttle:ai-design-save');
        Route::get('contents/{aiContent}/versions', [AIContentVersionController::class, 'index']);
        Route::get('contents/{aiContent}/versions/{version}', [AIContentVersionController::class, 'show']);
        Route::post('contents/{aiContent}/versions', [AIContentVersionController::class, 'restore'])->middleware('throttle:restore-version');
    });
});

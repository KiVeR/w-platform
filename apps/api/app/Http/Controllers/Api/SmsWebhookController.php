<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsWebhookController extends Controller
{
    public function sinch(Request $request): JsonResponse
    {
        return $this->storeReport('sinch', $request);
    }

    public function infobip(Request $request): JsonResponse
    {
        return $this->storeReport('infobip', $request);
    }

    public function highconnexion(Request $request): JsonResponse
    {
        return $this->storeReport('highconnexion', $request);
    }

    private function storeReport(string $provider, Request $request): JsonResponse
    {
        if (strlen($request->getContent()) > 102400) {
            return response()->json(['error' => 'Payload too large'], 413);
        }

        /** @var list<array<string, mixed>>|array<string, mixed> $payload */
        $payload = $request->all();

        // Some providers send arrays of reports
        $reports = array_is_list($payload) ? $payload : [$payload];

        foreach ($reports as $report) {
            DeliveryReport::create([
                'provider' => $provider,
                'report' => $report,
                'digested' => false,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
}

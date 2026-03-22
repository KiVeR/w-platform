<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'credited_invoice_id' => $this->credited_invoice_id,
            'invoice_number' => $this->invoice_number,
            'invoice_date' => $this->invoice_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'subtotal_ht' => $this->subtotal_ht,
            'tax_rate' => $this->tax_rate,
            'tax_amount' => $this->tax_amount,
            'total_ttc' => $this->total_ttc,
            'status' => $this->status?->value,
            'notes' => $this->notes,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'payment_method' => $this->payment_method,
            'created_at' => $this->created_at?->toIso8601String(),
            'partner' => new PartnerResource($this->whenLoaded('partner')),
            'lines' => JsonResource::collection($this->whenLoaded('lines')),
        ];
    }
}

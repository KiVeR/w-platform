<?php

declare(strict_types=1);

namespace App\Enums;

enum CancellationType: string
{
    case CLIENT_REQUEST   = 'client_request';
    case ADMIN_DECISION   = 'admin_decision';
    case PAYMENT_FAILURE  = 'payment_failure';
    case TECHNICAL_ERROR  = 'technical_error';
    case EXPIRED          = 'expired';

    public function label(): string
    {
        return match($this) {
            self::CLIENT_REQUEST  => 'Demande client',
            self::ADMIN_DECISION  => 'Décision administrative',
            self::PAYMENT_FAILURE => 'Échec de paiement',
            self::TECHNICAL_ERROR => 'Erreur technique',
            self::EXPIRED         => 'Expiré',
        };
    }
}

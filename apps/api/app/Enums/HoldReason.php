<?php

declare(strict_types=1);

namespace App\Enums;

enum HoldReason: string
{
    case AWAITING_CLIENT_RESPONSE    = 'awaiting_client_response';
    case AWAITING_PAYMENT            = 'awaiting_payment';
    case AWAITING_CREATIVE_APPROVAL  = 'awaiting_creative_approval';
    case AWAITING_FILE               = 'awaiting_file';
    case INSUFFICIENT_CREDITS        = 'insufficient_credits';
    case TECHNICAL_ISSUE             = 'technical_issue';
    case ADMIN_DECISION              = 'admin_decision';

    public function label(): string
    {
        return match($this) {
            self::AWAITING_CLIENT_RESPONSE   => 'En attente de réponse client',
            self::AWAITING_PAYMENT           => 'En attente de paiement',
            self::AWAITING_CREATIVE_APPROVAL => 'En attente de validation du créatif',
            self::AWAITING_FILE              => 'En attente de fichier',
            self::INSUFFICIENT_CREDITS       => 'Crédits insuffisants',
            self::TECHNICAL_ISSUE            => 'Problème technique',
            self::ADMIN_DECISION             => 'Décision administrative',
        };
    }
}

<?php

declare(strict_types=1);

namespace App\Enums;

enum PartnerFeatureKey: string
{
    // Campagnes
    case CAMPAIGN_PROSPECTION = 'campaign_prospection';
    case CAMPAIGN_FIDELISATION = 'campaign_fidelisation';
    case CAMPAIGN_COMPTAGE = 'campaign_comptage';

    // Fonctionnalités
    case SHOPS = 'shops';
    case SMS_TEMPLATES = 'sms_templates';
    case SHORT_URLS = 'short_urls';
    case PAYMENT = 'payment';

    // Ciblage (location)
    case LOCATION_POSTCODE = 'location_postcode';
    case LOCATION_GEOLOC = 'location_geoloc';
    case LOCATION_IRIS = 'location_iris';

    // Demo
    case DEMO_MODE = 'demo_mode';

    // Analytics
    case ANALYTICS_PROSPECTION = 'analytics_prospection';
    case ANALYTICS_FIDELISATION = 'analytics_fidelisation';
}

<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CampaignStatsAvailableNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Campaign $campaign,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Statistiques disponibles — « {$this->campaign->name} »")
            ->greeting('Statistiques disponibles')
            ->line("Les statistiques de la campagne **{$this->campaign->name}** sont maintenant disponibles.")
            ->action('Voir les statistiques', url("/campaigns/{$this->campaign->id}"));
    }
}

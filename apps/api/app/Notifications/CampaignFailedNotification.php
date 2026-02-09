<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CampaignFailedNotification extends Notification
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
            ->subject("Échec envoi campagne « {$this->campaign->name} »")
            ->error()
            ->greeting('Échec d\'envoi')
            ->line("La campagne **{$this->campaign->name}** a échoué.")
            ->line("Erreur : {$this->campaign->error_message}")
            ->line("Partner : {$this->campaign->partner?->name}")
            ->action('Voir la campagne', url("/campaigns/{$this->campaign->id}"));
    }
}

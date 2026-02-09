<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CampaignSentNotification extends Notification
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
            ->subject("Campagne « {$this->campaign->name} » envoyée")
            ->greeting('Campagne envoyée avec succès')
            ->line("La campagne **{$this->campaign->name}** a été envoyée.")
            ->line("Volume : **{$this->campaign->volume_estimated}** SMS")
            ->line("Type : {$this->campaign->type->value}")
            ->action('Voir la campagne', url("/campaigns/{$this->campaign->id}"));
    }
}

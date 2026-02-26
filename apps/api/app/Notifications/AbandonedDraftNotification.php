<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AbandonedDraftNotification extends Notification
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
        $deepLink = config('app.frontend_url')."/campaigns/new?draft={$this->campaign->id}";

        return (new MailMessage)
            ->subject("Brouillon en attente \u{2014} \u{00AB}\u{00A0}{$this->campaign->name}\u{00A0}\u{00BB}")
            ->greeting('Votre brouillon vous attend !')
            ->line("La campagne **{$this->campaign->name}** est restée en brouillon depuis plus de 48 heures.")
            ->line('Reprenez là où vous vous êtes arrêté et lancez votre campagne en quelques clics.')
            ->action('Reprendre le brouillon', $deepLink);
    }
}

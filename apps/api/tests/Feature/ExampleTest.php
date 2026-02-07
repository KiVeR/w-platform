<?php

declare(strict_types=1);

it('returns a successful response from the api', function (): void {
    $this->getJson('/api')
        ->assertOk()
        ->assertJsonStructure(['name', 'version']);
});

<?php

declare(strict_types=1);

use App\Console\Commands\MigrateTriggerApiDataCommand;
use App\Models\Campaign;
use App\Models\Partner;

it('is registered as an artisan command', function () {
    $commands = Artisan::all();

    expect($commands)->toHaveKey('app:migrate-trigger-api-data');
    expect($commands['app:migrate-trigger-api-data'])->toBeInstanceOf(MigrateTriggerApiDataCommand::class);
});

it('has the expected options', function () {
    $command = Artisan::all()['app:migrate-trigger-api-data'];
    $definition = $command->getDefinition();

    expect($definition->hasOption('source-mysql'))->toBeTrue();
    expect($definition->hasOption('source-mongo'))->toBeTrue();
    expect($definition->hasOption('dry-run'))->toBeTrue();
    expect($definition->hasOption('skip-reports'))->toBeTrue();
    expect($definition->hasOption('skip-logs'))->toBeTrue();

    expect($definition->getOption('source-mysql')->getDefault())->toBe('trigger-api');
    expect($definition->getOption('source-mongo')->getDefault())->toBe('mongodb');
});

it('fails gracefully when source MySQL connection is unavailable', function () {
    $this->artisan('app:migrate-trigger-api-data', [
        '--source-mysql' => 'nonexistent-connection',
        '--skip-reports' => true,
        '--skip-logs' => true,
    ])
        ->assertFailed()
        ->expectsOutputToContain('Cannot connect to MySQL');
});

it('extracts campaign IDs correctly via the extractCampaignId method', function () {
    $command = new MigrateTriggerApiDataCommand;

    // Use reflection to access the private method
    $method = new ReflectionMethod($command, 'extractCampaignId');
    $method->setAccessible(true);

    // Campaign ID map: trigger-api ID 100 => platform-api ID 1
    $campaignIdMap = [100 => 1, 200 => 2, 300 => 3];

    // Document with Campaign model_type and known model_id
    $doc = ['model_type' => 'App\\Models\\Campaign', 'model_id' => 100, 'message' => 'test'];
    expect($method->invoke($command, $doc, $campaignIdMap))->toBe(1);

    // Document with Campaign model_type and unknown model_id
    $doc = ['model_type' => 'App\\Models\\Campaign', 'model_id' => 999, 'message' => 'test'];
    expect($method->invoke($command, $doc, $campaignIdMap))->toBeNull();

    // Document without model_type but with model_id
    $doc = ['model_id' => 200, 'message' => 'test'];
    expect($method->invoke($command, $doc, $campaignIdMap))->toBe(2);

    // Document without model_id
    $doc = ['message' => 'test'];
    expect($method->invoke($command, $doc, $campaignIdMap))->toBeNull();

    // Document with non-Campaign model_type and model_id
    $doc = ['model_type' => 'App\\Models\\User', 'model_id' => 300];
    expect($method->invoke($command, $doc, $campaignIdMap))->toBeNull();
});

it('builds campaign ID map from external_id', function () {
    $partner = Partner::factory()->create();

    Campaign::factory()->for($partner)->create([
        'external_id' => '100',
    ]);
    Campaign::factory()->for($partner)->create([
        'external_id' => '200',
    ]);
    Campaign::factory()->for($partner)->create([
        'external_id' => null,
    ]);

    $command = new MigrateTriggerApiDataCommand;
    $method = new ReflectionMethod($command, 'buildCampaignIdMap');
    $method->setAccessible(true);

    $map = $method->invoke($command);

    expect($map)->toHaveCount(2);
    expect($map)->toHaveKey(100);
    expect($map)->toHaveKey(200);
});

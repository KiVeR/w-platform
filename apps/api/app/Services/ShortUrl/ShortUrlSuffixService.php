<?php

declare(strict_types=1);

namespace App\Services\ShortUrl;

use App\Models\ShortUrl;
use App\Models\ShortUrlSuffix;

class ShortUrlSuffixService
{
    /** @return list<string> */
    public function generateRandomUniqueSuffixes(
        ShortUrl $shortUrl,
        int $quantity,
        string $batchUuid,
        ?int $stringLength = null
    ): array {
        // Retrieve the current count of suffixes for uniqueness
        $lastNumber = $shortUrl->suffixes()->count();

        if ($stringLength === null) {
            $maxNumber = $lastNumber + $quantity;
            $stringLength = $this->calculateMinimumLength($maxNumber);
        }

        // Set the maximum number of suffixes to process per batch to optimize insertion
        $chunkSize = 1000;
        // Calculate the total number of batches needed
        $rounds = (int) ceil($quantity / $chunkSize);
        $data = [];

        // Process each batch of suffixes
        for ($r = 0; $r < $rounds; $r++) {
            // Determine the number of suffixes to generate in the current batch
            $currentBatchSize = min($chunkSize, $quantity - ($r * $chunkSize));
            $dataBatch = [];

            // Generate suffixes for the current batch
            for ($i = 0; $i < $currentBatchSize; $i++) {
                // Increment the count to ensure a unique value for each suffix
                $lastNumber++;
                // Convert the incremented number to a fixed-length base61 encoded slug
                $slug = $this->intToBase61($lastNumber, $stringLength);

                // Prepare the data for database insertion
                $dataBatch[] = [
                    'short_url_id' => $shortUrl->id,
                    'slug' => $slug,
                    'batch_uuid' => $batchUuid,
                ];

                // Add the generated slug to the result array
                $data[] = $slug;
            }

            // Insert the current batch of suffixes into the database
            ShortUrlSuffix::insert($dataBatch);
        }

        // Return the array containing all generated unique suffixes
        return $data;
    }

    public function calculateMinimumLength(int $maxNumber): int
    {
        if ($maxNumber <= 0) {
            return 1;
        }

        $length = (int) ceil(log($maxNumber + 1, 61));

        return max(1, $length);
    }

    public function intToBase61(int $num, int $padLength = 4): string
    {
        // Excludes '0' to prevent leading zeros (GA4 truncation issue)
        $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
        $base = 61;
        $result = '';

        while ($num > 0) {
            $result = $characters[$num % $base].$result;
            $num = intdiv($num, $base);
        }

        return str_pad($result, $padLength, 'a', STR_PAD_LEFT);
    }
}

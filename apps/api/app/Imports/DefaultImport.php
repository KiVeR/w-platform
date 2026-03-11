<?php

declare(strict_types=1);

namespace App\Imports;

use Maatwebsite\Excel\Concerns\Importable;

class DefaultImport
{
    use Importable;

    public function chunkSize(): int
    {
        return 1000;
    }
}

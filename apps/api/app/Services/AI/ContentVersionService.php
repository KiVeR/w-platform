<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Models\AIContent;
use App\Models\AIContentVersion;
use Illuminate\Support\Facades\DB;

class ContentVersionService
{
    public const int MAX_VERSIONS = 50;

    /**
     * Create a snapshot version of the current design.
     * Runs inside a transaction (caller can wrap externally, or this creates its own).
     */
    public function createVersion(AIContent $content): AIContentVersion
    {
        return DB::transaction(function () use ($content): AIContentVersion {
            $latest = AIContentVersion::where('ai_content_id', $content->id)
                ->orderByDesc('id')
                ->value('version');

            $newVersion = $this->incrementVersion($latest ?? '0.0');
            $widgetCount = $this->countWidgets($content->design);

            $version = AIContentVersion::create([
                'ai_content_id' => $content->id,
                'version' => $newVersion,
                'design' => $content->design ?? [],
                'widget_count' => $widgetCount,
            ]);

            $this->purgeOldVersions($content->id);

            return $version;
        });
    }

    /**
     * Increment a version string: "1.9" -> "1.10", "0.0" -> "1.1"
     * Mirrors the TypeScript incrementContentVersion() logic (major || 1).
     */
    public function incrementVersion(string $current): string
    {
        $parts = explode('.', $current);

        if (count($parts) !== 2) {
            return '1.0';
        }

        $major = (int) $parts[0] ?: 1;   // 0 → 1 (falsy coercion, mirrors JS `|| 1`)
        $minor = (int) $parts[1];

        return "{$major}." . ($minor + 1);
    }

    /**
     * Delete versions beyond the keep limit (oldest first).
     */
    public function purgeOldVersions(int $contentId, int $keep = self::MAX_VERSIONS): int
    {
        $toDelete = AIContentVersion::where('ai_content_id', $contentId)
            ->orderByDesc('id')
            ->skip($keep)
            ->pluck('id');

        if ($toDelete->isEmpty()) {
            return 0;
        }

        return AIContentVersion::whereIn('id', $toDelete)->delete();
    }

    /**
     * Restore the content design from a given version (in a transaction).
     */
    public function restoreVersion(AIContent $content, AIContentVersion $version): void
    {
        DB::transaction(function () use ($content, $version): void {
            $content->update(['design' => $version->design]);
            $this->createVersion($content);
        });
    }

    /**
     * Count top-level widgets in the design array.
     */
    private function countWidgets(mixed $design): int
    {
        if (! is_array($design)) {
            return 0;
        }

        $widgets = $design['widgets'] ?? [];

        if (! is_array($widgets)) {
            return 0;
        }

        return $this->countWidgetsRecursive($widgets);
    }

    /**
     * Recursively count all widgets including children.
     *
     * @param  array<mixed>  $widgets
     */
    private function countWidgetsRecursive(array $widgets): int
    {
        $count = count($widgets);

        foreach ($widgets as $widget) {
            if (is_array($widget) && isset($widget['children']) && is_array($widget['children'])) {
                $count += $this->countWidgetsRecursive($widget['children']);
            }
        }

        return $count;
    }
}

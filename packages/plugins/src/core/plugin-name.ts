/**
 * Normalize a raw plugin name into a consistent format suitable for
 * deduplication, comparison, and use as a fallback identifier.
 *
 * Normalization steps:
 *   1. Trim leading/trailing whitespace
 *   2. Lowercase
 *   3. Replace any character outside [a-z0-9_-] with a single underscore
 *   4. Collapse multiple consecutive underscores into one
 *   5. Strip leading/trailing underscores
 *
 * This is a pure function — same input always produces the same output,
 * no side effects, no external dependencies.
 *
 * @param raw - The raw plugin name string (may be empty, may contain special chars)
 * @returns The normalized plugin name, or an empty string if no valid chars remain
 *
 * @example
 *   normalizePluginName('  My Plugin!!  ')  // 'my_plugin'
 *   normalizePluginName('DataLoader')        // 'dataloader'
 *   normalizePluginName('@scope/name')       // 'scope_name'
 *   normalizePluginName('already-clean')     // 'already-clean'
 *   normalizePluginName('')                  // ''
 *   normalizePluginName('!!!')               // ''
 */
export function normalizePluginName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

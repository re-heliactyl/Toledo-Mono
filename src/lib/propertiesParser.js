/**
 * Parse server.properties text content into a key-value object.
 * Skips comments and empty lines. Trims whitespace around keys/values.
 */
export function parseProperties(text) {
  const result = {};
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const sep = trimmed.indexOf('=');
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    const value = trimmed.slice(sep + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Serialize a key-value object back to server.properties format.
 * Outputs keys in alphabetical order with no extra whitespace around '='.
 */
export function serializeProperties(obj) {
  const keys = Object.keys(obj).sort();
  return keys.map((k) => `${k}=${String(obj[k])}`).join('\n') + '\n';
}

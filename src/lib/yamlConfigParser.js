import { load, dump } from 'js-yaml';

export function parseYaml(text) {
  try {
    const result = load(text);
    return (typeof result === 'object' && result !== null) ? result : {};
  } catch {
    return {};
  }
}

export function serializeYaml(obj) {
  try {
    return dump(obj, { indent: 2, lineWidth: -1, noRefs: true, quotingType: "'", forceQuotes: false });
  } catch {
    return '';
  }
}

/** Get nested value from object via dot path: "world-settings.default.view-distance" */
export function getPath(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

/** Set nested value in object via dot path, creating missing objects */
export function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

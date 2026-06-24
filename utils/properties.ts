export function parseProperties(text: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();

    // Set nested value
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) {
            current[part] = {};
        }
        current = current[part];
    }
    const lastPart = parts[parts.length - 1];

    // Array logic
    if (/^\d+$/.test(lastPart)) {
         // It might be better to keep it as object initially and try formatting later if needed,
         // but the requirement says "还原为嵌套的 JSON 对象", we'll just use objects with numeric strings as keys,
         // which serialize to JSON similarly for our purpose or can be mapped if strictly array needed.
         current[lastPart] = value;
    } else {
         current[lastPart] = value;
    }
  }

  // Optional: A recursive pass to convert pure numeric-keyed objects to arrays
  function objectToArrays(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;

    const keys = Object.keys(obj);
    if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
        // all keys are numeric
        const max = Math.max(...keys.map(Number));
        if (max < keys.length * 2) { // heuristic to avoid sparse array explosion
             const arr = new Array(max + 1).fill(undefined);
             for(const k of keys) {
                 arr[Number(k)] = objectToArrays(obj[k]);
             }
             return arr;
        }
    }

    for (const k in obj) {
       obj[k] = objectToArrays(obj[k]);
    }
    return obj;
  }

  return objectToArrays(result);
}

export function stringifyProperties(obj: any): string {
    const lines: string[] = [];

    function flatten(current: any, prefix: string) {
        if (current === null || typeof current !== 'object') {
             lines.push(`${prefix}=${current ?? ''}`);
             return;
        }

        if (Array.isArray(current)) {
             for (let i = 0; i < current.length; i++) {
                 if (current[i] !== undefined) {
                     flatten(current[i], prefix ? `${prefix}.${i}` : `${i}`);
                 }
             }
             return;
        }

        for (const key in current) {
             flatten(current[key], prefix ? `${prefix}.${key}` : key);
        }
    }

    flatten(obj, '');
    return lines.join('\n');
}

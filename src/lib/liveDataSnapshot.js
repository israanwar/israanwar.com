// Public repository values are JSON records. Keep a cached reference when a
// refresh returns the same records so value-only consumers do not redraw.
// Private values and custom objects always retain their normal update path.
function sameRecords(a, b) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && a.length !== b.length) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (!Array.isArray(a) && Object.getPrototypeOf(a) !== Object.prototype) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => Object.hasOwn(b, key) && sameRecords(a[key], b[key]));
}

export function preservePublicValue(key, previous, next) {
  if (!/^(settings$|homepage$|page:|products:|product:|services:|service:|posts:|post:)/.test(key)) return next;
  return sameRecords(previous, next) ? previous : next;
}

export function preserveLiveSnapshot(previous, next, valueOnly = false) {
  if (Object.is(previous.value, next.value) &&
      (valueOnly || (previous.loading === next.loading && previous.error === next.error))) return previous;
  return next;
}

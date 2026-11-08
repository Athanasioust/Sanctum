/**
 * The search index's freshness counter, kept dependency-free so `apiRoute`
 * can bump it without importing the database into every module that uses it.
 */
const store = globalThis as typeof globalThis & { __sanctumSearchGen?: number };

/** Mark every campaign's search index out of date. */
export function markSearchStale() {
  store.__sanctumSearchGen = (store.__sanctumSearchGen ?? 0) + 1;
}

export function searchGeneration(): number {
  return store.__sanctumSearchGen ?? 0;
}

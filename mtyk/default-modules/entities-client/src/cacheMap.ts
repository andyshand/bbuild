import { map, scan } from "rxjs/operators";

const cache = new Map();
export function cacheMap(transformFn) {
  return source$ => source$.pipe(
    scan((_cache, keys: string[]) => {
      for (const key of keys) {
        if (!cache.has(key)) {
          const result = transformFn(key);
          cache.set(key, result);
        }
      }
      return cache;
    }, cache),
    map((cache: Map<any, any>) => Array.from(cache.values()))
  );
}

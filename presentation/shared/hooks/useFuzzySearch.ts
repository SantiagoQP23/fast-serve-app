import { useMemo } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";

const DEFAULT_OPTIONS = {
  threshold: 0.35,
  ignoreLocation: true,
  ignoreDiacritics: true,
};

/**
 * Fuzzy-filters `items` by `query` using Fuse.js.
 * Returns `items` untouched when the query is empty; otherwise the matches
 * sorted by relevance (best first).
 *
 * `options` must be a stable reference (e.g. a module-level constant).
 */
export function useFuzzySearch<T>(
  items: T[],
  query: string,
  options: IFuseOptions<T>,
): T[] {
  const fuse = useMemo(
    () => new Fuse(items, { ...DEFAULT_OPTIONS, ...options }),
    [items, options],
  );

  return useMemo(() => {
    const term = query.trim();
    if (!term) return items;
    return fuse.search(term).map((result) => result.item);
  }, [fuse, items, query]);
}

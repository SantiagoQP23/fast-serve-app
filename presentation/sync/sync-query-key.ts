export const syncQueryKey = (restaurantId?: string) =>
  ["sync", restaurantId] as const;

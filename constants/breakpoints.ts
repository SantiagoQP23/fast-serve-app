/**
 * Layout breakpoints in dp, aligned with Material window size classes.
 */
export const BREAKPOINTS = {
  /** Shortest side at or above this is a tablet, regardless of rotation. */
  TABLET_SHORTEST_SIDE: 600,
  /** Window width at or above this switches to two-pane layouts. */
  EXPANDED: 840,
} as const;

/** Max content width for forms and detail screens on large screens. */
export const CONTENT_MAX_WIDTH = 720;

/** Max width for horizontally scrolling order cards. */
export const CAROUSEL_CARD_MAX_WIDTH = 380;

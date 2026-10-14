import { useCallback } from "react";
import { useWindowDimensions } from "react-native";
import { BREAKPOINTS } from "@/constants/breakpoints";

/**
 * Reactive layout info for adapting screens to phones and tablets.
 * Re-renders on rotation and window resize.
 */
export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();

  const isTablet = Math.min(width, height) >= BREAKPOINTS.TABLET_SHORTEST_SIDE;
  const isLandscape = width > height;
  const isExpanded = width >= BREAKPOINTS.EXPANDED;

  /**
   * Number of columns that fit in `availableWidth` (defaults to the window
   * width) given a minimum item width and the gap between items.
   */
  const gridColumns = useCallback(
    (minItemWidth: number, gap = 0, availableWidth = width) =>
      Math.max(1, Math.floor((availableWidth + gap) / (minItemWidth + gap))),
    [width],
  );

  return { width, height, isTablet, isLandscape, isExpanded, gridColumns };
};

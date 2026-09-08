import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

/**
 * Calls the provided callback whenever the app transitions from background
 * or inactive to active (foreground).
 */
export const useAppForeground = (callback: () => void) => {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const previousAppState = appStateRef.current;

      if (
        (previousAppState === "background" || previousAppState === "inactive") &&
        nextAppState === "active"
      ) {
        callbackRef.current();
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
};

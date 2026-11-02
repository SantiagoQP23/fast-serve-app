import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { Accelerometer, AccelerometerMeasurement } from "expo-sensors";

/** Sensor sample rate. 10 per second is enough to see a shake. */
const UPDATE_INTERVAL_MS = 100;
/** A movement this strong (in g, gravity taken out) counts as one jolt. */
const JOLT_THRESHOLD_G = 1.2;
/** How fast the gravity estimate follows the phone's tilt (0..1). */
const GRAVITY_SMOOTHING = 0.8;
/** Jolts closer than this are the same movement. */
const MIN_JOLT_GAP_MS = 150;
/** This many jolts, each the other way from the last, make a shake... */
const JOLTS_PER_SHAKE = 3;
/** ...if they all happen within this window. */
const SHAKE_WINDOW_MS = 1000;

type Axis = "x" | "y" | "z";
type Vector = Pick<AccelerometerMeasurement, "x" | "y" | "z">;

/** The axis that moved the most, and which way (+1 / -1). */
const dominantDirection = ({ x, y, z }: Vector) => {
  const axis: Axis =
    Math.abs(x) >= Math.abs(y) && Math.abs(x) >= Math.abs(z)
      ? "x"
      : Math.abs(y) >= Math.abs(z)
        ? "y"
        : "z";
  const value = { x, y, z }[axis];
  return `${axis}${value >= 0 ? "+" : "-"}`;
};

/**
 * Calls `onShake` when the phone is shaken back and forth. A single knock
 * (putting the phone down hard, walking fast) isn't enough: it takes
 * several strong jolts in alternating directions within a second.
 *
 * Listens only while `enabled` and the app is in the foreground, so the
 * sensor is off in the background.
 */
export const useShake = (onShake: () => void, enabled = true) => {
  const onShakeRef = useRef(onShake);
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!enabled || !active) return;

    let cancelled = false;
    let subscription: { remove: () => void } | null = null;
    let jolts: number[] = [];
    let lastDirection: string | null = null;
    // Gravity, followed slowly, so only the phone's own movement is left.
    let gravity: Vector | null = null;

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;

        Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
        subscription = Accelerometer.addListener((sample) => {
          const g: Vector = gravity
            ? {
                x:
                  GRAVITY_SMOOTHING * gravity.x +
                  (1 - GRAVITY_SMOOTHING) * sample.x,
                y:
                  GRAVITY_SMOOTHING * gravity.y +
                  (1 - GRAVITY_SMOOTHING) * sample.y,
                z:
                  GRAVITY_SMOOTHING * gravity.z +
                  (1 - GRAVITY_SMOOTHING) * sample.z,
              }
            : { x: sample.x, y: sample.y, z: sample.z };
          gravity = g;
          const move: Vector = {
            x: sample.x - g.x,
            y: sample.y - g.y,
            z: sample.z - g.z,
          };
          const strength = Math.sqrt(
            move.x * move.x + move.y * move.y + move.z * move.z,
          );
          if (strength < JOLT_THRESHOLD_G) return;

          const now = Date.now();
          const direction = dominantDirection(move);
          const last = jolts[jolts.length - 1];
          if (last !== undefined && now - last < MIN_JOLT_GAP_MS) return;
          if (direction === lastDirection) return;

          lastDirection = direction;
          jolts = [...jolts, now].filter((t) => now - t <= SHAKE_WINDOW_MS);
          if (jolts.length >= JOLTS_PER_SHAKE) {
            jolts = [];
            lastDirection = null;
            onShakeRef.current();
          }
        });
      })
      .catch(() => {
        // No sensor (or an old build without the native module): no shake.
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, active]);
};

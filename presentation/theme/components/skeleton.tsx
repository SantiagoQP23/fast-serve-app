import React, { useEffect, useRef } from "react";
import { Animated, ViewProps } from "react-native";
import tw from "@/presentation/theme/lib/tailwind";

interface SkeletonProps extends ViewProps {
  style?: any;
}

export default function Skeleton({ style, ...props }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        tw`bg-gray-200 dark:bg-gray-700 rounded-md`,
        { opacity },
        style,
      ]}
      {...props}
    />
  );
}

import React, { useEffect, useRef } from "react";
import { Animated, View, useColorScheme } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { Colors } from "@/constants/theme";

interface CircularProgressGaugeProps {
  percentage: number; // 0-100
  currentValue: number;
  goalValue: number;
  currentLabel: string;
  goalLabel: string;
  size?: number;
  strokeWidth?: number;
  accentColor?: string;
  backgroundColor?: string;
  formatValue?: (value: number) => string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularProgressGauge({
  percentage,
  currentValue,
  goalValue,
  currentLabel,
  goalLabel,
  size = 200,
  strokeWidth = 16,
  accentColor,
  backgroundColor,
  formatValue = (val) => val.toString(),
}: CircularProgressGaugeProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  
  // Get colors with fallback to theme primary color
  const themePrimaryColor = colorScheme === "dark" ? Colors.dark.primary : Colors.light.primary;
  const primaryColor = accentColor || themePrimaryColor;
  const bgColor = backgroundColor || tw.color("gray-200") || "#E5E7EB";
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: clampedPercentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [clampedPercentage, animatedValue]);

  // Interpolate the stroke dash offset for animation
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <ThemedView style={tw`items-center bg-transparent`}>
      {/* SVG Circle */}
      <View style={{ width: size, height: size, position: "relative" }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
          {/* Progress Circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={primaryColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>

        {/* Centered Text */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText type="h1" style={[tw`font-bold`, { color: primaryColor }]}>
            {Math.round(clampedPercentage)}%
          </ThemedText>
          <ThemedText type="caption" style={tw`text-gray-500 mt-1`}>
            {currentLabel}
          </ThemedText>
        </View>
      </View>

      {/* Labels Below */}
      <ThemedView style={tw`mt-6 flex-row justify-around w-full max-w-xs`}>
        <ThemedView style={tw`items-center flex-1`}>
          <ThemedText type="small" style={tw`text-gray-500 mb-1`}>
            {currentLabel}
          </ThemedText>
          <ThemedText type="body1" style={[tw`font-semibold`, { color: primaryColor }]}>
            {formatValue(currentValue)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`items-center flex-1`}>
          <ThemedText type="small" style={tw`text-gray-500 mb-1`}>
            {goalLabel}
          </ThemedText>
          <ThemedText type="body1" style={tw`font-semibold text-gray-700`}>
            {formatValue(goalValue)}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

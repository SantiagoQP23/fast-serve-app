import { View } from "react-native";
import tw from "../lib/tailwind";

export default function ProgressBar({
  progress = 0, // number from 0 to 1
  height = 3,
  bgColor = "bg-light-secondary",
  progressColor = "bg-light-primary",
  style = "",
  variant = "default", // "default" | "segmented"
  segments = 5,
  segmentWidth = 5,
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  if (variant === "segmented") {
    const filledCount = Math.round(clampedProgress * segments);

    return (
      <View style={tw`flex-row self-start gap-1 ${style}`}>
        {Array.from({ length: segments }).map((_, index) => (
          <View
            key={index}
            style={tw`w-${segmentWidth} h-${height} rounded-full ${
              index < filledCount ? progressColor : bgColor
            }`}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={tw`${bgColor} w-full rounded-full overflow-hidden ${style}`}>
      <View
        style={[
          tw`${progressColor} h-${height}`,
          { width: `${clampedProgress * 100}%` },
        ]}
      />
    </View>
  );
}

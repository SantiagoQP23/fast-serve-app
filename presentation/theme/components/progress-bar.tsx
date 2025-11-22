import { View } from "react-native";
import tw from "../lib/tailwind";

export default function ProgressBar({
  progress = 0, // number from 0 to 1
  height = 3,
  bgColor = "bg-gray-200",
  progressColor = "bg-light-primary",
  style = "",
}) {
  return (
    <View style={tw`${bgColor} w-full rounded-full overflow-hidden ${style}`}>
      <View
        style={[
          tw`${progressColor} h-${height}`,
          { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` },
        ]}
      />
    </View>
  );
}

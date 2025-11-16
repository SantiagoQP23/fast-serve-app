import { Text, View } from "react-native";
import tw from "../lib/tailwind";

export interface NotificationBadgeProps {
  value: number;
  style?: string;
}

export default function NotificationBadge({
  value,
  style = "",
}: NotificationBadgeProps) {
  if (!value || value <= 0) return null;

  return (
    <View
      style={tw`
        absolute -top-1 -right-1
        bg-light-secondary 
        rounded-full 
        h-4 w-4 
        items-center justify-center
        ${style}
      `}
    >
      <Text style={tw`text-white text-xs font-bold`}>
        {value > 99 ? "99+" : value}
      </Text>
    </View>
  );
}

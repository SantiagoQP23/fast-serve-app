import Label from "@/presentation/theme/components/label";
import { useOrderElapsedTime } from "@/presentation/orders/hooks/useOrderElapsedTime";

interface OrderElapsedTimeLabelProps {
  deliveryTime: Date | string;
  size?: "medium" | "small";
}

export default function OrderElapsedTimeLabel({
  deliveryTime,
  size = "medium",
}: OrderElapsedTimeLabelProps) {
  const { elapsedLabel, elapsedColor, isStale, shouldShow } =
    useOrderElapsedTime(deliveryTime);

  if (!shouldShow) return null;

  return (
    <Label
      leftIcon="timer"
      text={elapsedLabel}
      color={isStale ? "default" : elapsedColor}
      size={size}
    />
  );
}

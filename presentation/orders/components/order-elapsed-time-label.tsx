import Label from "@/presentation/theme/components/label";
import { useOrderElapsedTime } from "@/presentation/orders/hooks/useOrderElapsedTime";

interface OrderElapsedTimeLabelProps {
  deliveryTime: Date | string;
}

export default function OrderElapsedTimeLabel({
  deliveryTime,
}: OrderElapsedTimeLabelProps) {
  const { elapsedLabel, elapsedColor, shouldShow } =
    useOrderElapsedTime(deliveryTime);

  if (!shouldShow) return null;

  return (
    <Label
      leftIcon="timer-outline"
      text={elapsedLabel}
      color={elapsedColor}
      variant="solid"
    />
  );
}

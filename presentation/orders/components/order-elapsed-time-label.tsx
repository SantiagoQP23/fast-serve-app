import Label from "@/presentation/theme/components/label";
import { useOrderElapsedTime } from "@/presentation/orders/hooks/useOrderElapsedTime";

interface OrderElapsedTimeLabelProps {
  since: Date | string;
}

export default function OrderElapsedTimeLabel({
  since,
}: OrderElapsedTimeLabelProps) {
  const { elapsedLabel, elapsedColor } = useOrderElapsedTime(since);

  return (
    <Label
      leftIcon="timer-outline"
      text={elapsedLabel}
      color={elapsedColor}
      variant="solid"
    />
  );
}

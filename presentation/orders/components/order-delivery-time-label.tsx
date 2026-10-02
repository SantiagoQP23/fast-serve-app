import dayjs from "dayjs";
import Label from "@/presentation/theme/components/label";
import { useOrderElapsedTime } from "@/presentation/orders/hooks/useOrderElapsedTime";

interface OrderDeliveryTimeLabelProps {
  deliveryTime: Date | string;
}

export default function OrderDeliveryTimeLabel({
  deliveryTime,
}: OrderDeliveryTimeLabelProps) {
  const { elapsedColor, shouldShow } = useOrderElapsedTime(deliveryTime);

  return (
    <Label
      leftIcon="time-outline"
      text={dayjs(deliveryTime).format("HH:mm")}
      color={shouldShow ? elapsedColor : "default"}
      variant={shouldShow ? "solid" : "soft"}
      size="small"
    />
  );
}

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { Pressable, PressableProps } from "react-native";
import Card from "@/presentation/theme/components/card";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";

/** The icon that stands for a payment method type everywhere it's shown. */
export const getPaymentMethodIcon = (
  type: PaymentMethodCategory | undefined,
): IconName => {
  switch (type) {
    case PaymentMethodCategory.CASH:
      return "banknote";
    case PaymentMethodCategory.CARD:
      return "credit-card";
    case PaymentMethodCategory.TRANSFER:
      return "wallet";
    case PaymentMethodCategory.DIGITAL_WALLET:
      return "smartphone";
    default:
      return "circle-ellipsis";
  }
};

export interface PaymentMethod {
  name: string;
  value: string;
  icon: IconName;
}

interface PaymentMethodCardProps extends PressableProps {
  paymentMethod: PaymentMethod;
  active?: boolean;
  variant?: "horizontal" | "vertical";
}

export default function PaymentMethodCard({
  paymentMethod,
  active = false,
  variant = "horizontal",
  onPress,
}: PaymentMethodCardProps) {
  if (variant === "vertical") {
    return (
      <Card
        onPress={onPress}
        style={({ pressed }) => [
          tw`flex-row items-center `,
          pressed && tw`opacity-80`,
          active && tw`bg-secondary`,
        ]}
        variant="outline"
      >
        <Icon name={paymentMethod.icon} size={22} color={tw.color("text")} />
        <ThemedText type="h4" style={tw`flex-1 ml-3`}>
          {paymentMethod.name}
        </ThemedText>
        <Icon name="chevron-right" size={18} color={tw.color("text")} />
      </Card>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`py-4 px-10 rounded-2xl items-center border border-gray-200`,
        pressed && tw`opacity-80`,
        active && tw`border-primary bg-gray-100`,
      ]}
    >
      <Icon name={paymentMethod.icon} size={30} color={tw.color("gray-700")} />
      <ThemedView style={tw`flex-row items-center bg-transparent`}>
        <ThemedText type="h4">{paymentMethod.name}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

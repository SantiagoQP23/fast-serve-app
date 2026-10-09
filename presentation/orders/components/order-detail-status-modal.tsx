import { Modal, Pressable } from "react-native";
import {
  OrderDetail,
  OrderDetailStatus,
} from "@/core/orders/models/order-detail.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import IconButton from "@/presentation/theme/components/icon-button";
import { typography } from "@/constants/theme";

interface OrderDetailStatusModalProps {
  visible: boolean;
  detail: OrderDetail;
  onSelectStatus: (status: OrderDetailStatus) => void;
  onClose: () => void;
}

interface StatusOption {
  status: OrderDetailStatus;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  iconColor: string;
  disabled?: boolean;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    status: OrderDetailStatus.PENDING,
    icon: "time-outline",
    labelKey: "common:status.pending",
    iconColor: "orange-400",
  },
  {
    status: OrderDetailStatus.IN_PROGRESS,
    icon: "flame-outline",
    labelKey: "common:status.inProgress",
    iconColor: "blue-700",
    disabled: true,
  },
  {
    status: OrderDetailStatus.READY,
    icon: "notifications-outline",
    labelKey: "common:status.ready",
    iconColor: "emerald-500",
    disabled: true,
  },
  {
    status: OrderDetailStatus.DELIVERED,
    icon: "checkmark-done-circle-outline",
    labelKey: "common:status.delivered",
    iconColor: "green-600",
  },
];

const OrderDetailStatusModal = ({
  visible,
  detail,
  onSelectStatus,
  onClose,
}: OrderDetailStatusModalProps) => {
  const { t } = useTranslation(["common", "orders"]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      style={tw` shadow-xl`}
    >
      <Pressable
        style={tw`flex-1  items-center justify-center `}
        onPress={onClose}
      >
        <Pressable
          style={tw`bg-white rounded-2xl w-4/5 p-6 shadow-lg`}
          onPress={(e) => e.stopPropagation()}
        >
          <ThemedView
            style={tw`flex-row items-center justify-between -mt-1 -mr-1`}
          >
            <ThemedText
              type="body1"
              style={{ fontFamily: typography.semibold }}
            >
              {t("orders:detailActions.statusTitle")}
            </ThemedText>
            <IconButton
              icon="close-outline"
              size={25}
              style={tw`bg-light-surface p-2`}
              onPress={onClose}
              accessibilityLabel={t("common:actions.close")}
            />
          </ThemedView>

          <ThemedView style={tw`mt-4 gap-2`}>
            {STATUS_OPTIONS.map((option) => {
              const isSelected = detail.status === option.status;
              return (
                <Pressable
                  key={option.status}
                  disabled={option.disabled}
                  onPress={() => onSelectStatus(option.status)}
                  style={({ pressed }) => [
                    tw.style(
                      "flex-row items-center gap-3 py-2  rounded-xl",
                      pressed && !option.disabled && "bg-gray-100",
                      option.disabled && "opacity-40",
                    ),
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={
                      option.disabled
                        ? tw.color("gray-400")
                        : tw.color(option.iconColor)
                    }
                  />
                  <ThemedText type="body1" style={tw`flex-1 `}>
                    {t(option.labelKey)}
                  </ThemedText>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={tw.color("light-on-surface")}
                    />
                  )}
                </Pressable>
              );
            })}
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default OrderDetailStatusModal;

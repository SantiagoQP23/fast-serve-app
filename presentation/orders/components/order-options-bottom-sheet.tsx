import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Alert, Pressable } from "react-native";
import { Order } from "@/core/orders/models/order.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { OrderPaymentStatus } from "@/core/orders/enums/order-payment-status.enum";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import { useOrders } from "../hooks/useOrders";
import { useRouter } from "expo-router";
import { useOrdersStore } from "../store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { i18nAlert } from "@/core/i18n/utils";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

interface OrderOptionsBottomSheetProps {
  order: Order;
  onClose?: () => void;
  onReassign?: () => void;
}

interface OptionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
  divider?: boolean;
  visible?: boolean;
}

const OrderOptionsBottomSheet = ({
  order,
  onClose,
  onReassign,
}: OrderOptionsBottomSheetProps) => {
  const { t, language } = useTranslation(["common", "orders", "bills"]);
  const { mutate: updateOrder } = useOrders().updateOrder;
  const { mutate: updateMultipleOrderDetailsStatus } =
    useOrders().updateMultipleOrderDetailsStatus;
  const { mutate: deleteOrder } = useOrders().deleteOrder;
  const router = useRouter();
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const { user } = useAuthStore();
  const isAdmin = user?.role?.name === "admin";

  const toCamelCase = (str: string) =>
    str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

  const generateOrderHtml = () => {
    const orderStatusKey = toCamelCase(order.status);
    const orderStatusLabel = t(`common:status.${orderStatusKey}`);

    const orderTypeKey = toCamelCase(order.type);
    const orderTypeLabel = t(`common:orderType.${orderTypeKey}`);

    let paymentStatusLabel: string;
    if (order.paymentStatus === OrderPaymentStatus.PARTIALLY_PAID) {
      paymentStatusLabel = t("bills:partiallyPaid");
    } else {
      const paymentStatusKey = toCamelCase(order.paymentStatus);
      paymentStatusLabel = t(`common:status.${paymentStatusKey}`);
    }

    const detailsHtml = order.details
      .map(
        (detail) => `
        <div style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <span>${detail.quantity}x ${detail.product.name}</span>
            <span style="white-space:nowrap;margin-left:8px;">$${(detail.quantity * detail.price).toFixed(2)}</span>
          </div>
          ${detail.productOption ? `<div style="padding-left:12px;font-size:12px;color:#000;">${detail.productOption.name}</div>` : ""}
          ${detail.tags.length ? `<div style="padding-left:12px;font-size:12px;color:#000;">${detail.tags.map((t) => t.name).join(", ")}</div>` : ""}
          ${detail.description ? `<div style="padding-left:12px;font-size:12px;color:#000;">${detail.description}</div>` : ""}
          <div style="padding-left:12px;font-size:12px;color:#333;">
            $${detail.price.toFixed(2)} / ${t("common:labels.quantity").toLowerCase()}
          </div>
        </div>
      `,
      )
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 100%;
              margin: 0;
              font-family: sans-serif;
              font-size: 13px;
              line-height: 1.4;
              color: #222;
              padding: 2mm;
            }
            .center { text-align: center; }
            .divider {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .row-start {
              display: flex;
              justify-content: flex-start;
              gap: 4px;
              margin-bottom: 2px;
            }
            .total {
              font-size: 15px;
              text-align: right;
              margin-top: 4px;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              color: #555;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="center" style="font-size:16px;margin-bottom:2px;">
            ${t("orders:details.orderNumber", { num: order.num })}
          </div>
          <div class="center" style="margin-bottom:4px;">
            ${order.table ? `${t("common:labels.table")}: ${order.table.name}` : t("common:labels.takeAway")}
          </div>

          <div class="divider"></div>

          <div class="row-start">
            <span>${t("common:labels.waiter")}:</span>
            <span>${order.user?.name ?? "N/A"}</span>
          </div>
          <div class="row-start">
            <span>${t("common:labels.date")}:</span>
            <span>${new Date(order.createdAt).toLocaleString(language)}</span>
          </div>
          <div class="row-start">
            <span>${t("orders:confirmation.status")}</span>
            <span>${orderStatusLabel}</span>
          </div>
          <div class="row-start">
            <span>${t("common:labels.total")}:</span>
            <span>${paymentStatusLabel} | ${order.isPaid ? t("common:status.paid") : t("common:status.unpaid")}</span>
          </div>
          <div class="row-start">
            <span>${t("orders:newOrder.orderType")}:</span>
            <span>${orderTypeLabel}</span>
          </div>
          <div class="row-start">
            <span>${t("common:labels.people")}:</span>
            <span>${order.people}</span>
          </div>
          ${
            order.deliveryTime
              ? `
          <div class="row-start">
            <span>${t("orders:details.deliveryTime")}:</span>
            <span>${new Date(order.deliveryTime).toLocaleString(language)}</span>
          </div>
          `
              : ""
          }

          ${
            order.notes
              ? `
          <div class="divider"></div>
          <div class="row-start">
            <span>${t("common:labels.notes")}:</span>
            <span>${order.notes}</span>
          </div>
          `
              : ""
          }

          <div class="divider"></div>

          ${detailsHtml}

          <div class="divider"></div>

          <div class="total">
            ${t("orders:confirmation.total")} $${order.total.toFixed(2)}
          </div>

          <div class="divider"></div>

          <div class="footer">
            ${new Date().toLocaleString(language)}
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintOrder = async () => {
    try {
      const html = generateOrderHtml();
      const height = Math.max(600, 400 + order.details.length * 130);
      const { uri } = await Print.printToFileAsync({
        html,
        width: 204,
        height,
      });
      await Print.printAsync({ uri });
    } catch (error) {
      console.error("Error printing order:", error);
    }
  };

  const handleShareOrder = async () => {
    try {
      const html = generateOrderHtml();
      const height = Math.max(600, 400 + order.details.length * 130);
      const { uri } = await Print.printToFileAsync({
        html,
        width: 204,
        height,
      });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: t("orders:details.orderNumber", { num: order.num }),
      });
    } catch (error) {
      console.error("Error sharing order:", error);
    }
  };

  const handleCloseOrder = () => {
    Alert.alert(
      t("orders:dialogs.closeTitle"),
      t("orders:dialogs.closeMessage"),
      [
        { text: t("common:actions.cancel"), style: "cancel" },
        {
          text: t("common:actions.close"),
          style: "destructive",
          onPress: () => {
            updateOrder(
              { id: order.id, isClosed: true },
              {
                onSuccess: () => {
                  onClose?.();
                  router.back();
                },
              },
            );
          },
        },
      ],
    );
  };

  const handleDeleteOrder = () => {
    const orderCantBeDeleted =
      order.status !== OrderStatus.PENDING ||
      order.details.some((detail) => detail.qtyDelivered !== 0);

    if (orderCantBeDeleted) {
      i18nAlert(
        t("orders:deleteAlerts.cannotDelete"),
        t("orders:deleteAlerts.cannotDeleteMessage"),
      );
      return;
    }

    Alert.alert(
      t("orders:deleteAlerts.confirmDelete"),
      t("orders:deleteAlerts.confirmDeleteMessage"),
      [
        { text: t("common:actions.cancel"), style: "cancel" },
        {
          text: t("common:actions.delete"),
          style: "destructive",
          onPress: () => {
            deleteOrder(order.id, {
              onSuccess: () => {
                onClose?.();
                setActiveOrder(null);
                router.back();
              },
            });
          },
        },
      ],
    );
  };

  const handleChangeStatus = (status: OrderDetailStatus) => {
    const validDetails = order.details.filter(
      (detail) => detail.status !== OrderDetailStatus.CANCELLED,
    );
    updateMultipleOrderDetailsStatus(
      {
        orderDetails: validDetails.map((detail) => detail.id),
        status,
      },
      {
        onSuccess: () => {
          onClose?.();
        },
      },
    );
  };

  const handleNavigateToPayments = () => {
    onClose?.();
    router.push(`/(order)/${order.id}/bills`);
  };

  const handleNavigateToAddProduct = () => {
    onClose?.();
    router.push("/restaurant-menu");
  };

  const orderCantBeDeleted =
    order.status !== OrderStatus.PENDING ||
    order.details.some((detail) => detail.qtyDelivered !== 0);

  const canCloseOrder = order.status === OrderStatus.DELIVERED && order.isPaid;
  const canForceCloseOrder =
    isAdmin && order.status === OrderStatus.DELIVERED && !order.isPaid;

  const options: OptionItem[] = [
    {
      icon: "print-outline",
      label: t("orders:options.printOrder"),
      onPress: handlePrintOrder,
    },
    {
      icon: "share-outline",
      label: t("orders:options.shareOrder"),
      onPress: handleShareOrder,
    },
    {
      icon: "add-circle-outline",
      label: t("orders:options.addProduct"),
      onPress: handleNavigateToAddProduct,
    },
    {
      icon: "person-outline",
      label: t("orders:options.reassignOrder"),
      onPress: () => {
        onClose?.();
        onReassign?.();
      },
      divider: true,
    },
    {
      icon: "card-outline",
      label: t("orders:options.goToPayments"),
      onPress: handleNavigateToPayments,
    },
    {
      icon: "checkmark-done-outline",
      label: t("orders:options.markDelivered"),
      onPress: () => handleChangeStatus(OrderDetailStatus.DELIVERED),
      disabled: order.details.every(
        (detail) => detail.status === OrderDetailStatus.DELIVERED,
      ),
      divider: true,
    },
    {
      icon: "lock-closed-outline",
      label: t("orders:options.closeOrder"),
      onPress: handleCloseOrder,
      disabled: !canCloseOrder,
    },
    {
      icon: "lock-closed-outline",
      label: t("orders:options.forceCloseOrder"),
      onPress: handleCloseOrder,
      disabled: !canForceCloseOrder,
      visible: isAdmin,
      divider: true,
    },
    {
      icon: "trash-outline",
      label: t("orders:options.deleteOrder"),
      color: "text-red-500",
      onPress: handleDeleteOrder,
      disabled: orderCantBeDeleted,
    },
  ];

  const visibleOptions = options.filter((opt) => opt.visible !== false);

  return (
    <BottomSheetView style={tw`px-4 pb-6`}>
      <ThemedView style={tw`mb-4`}>
        <ThemedText type="h3">{t("orders:options.title")}</ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
          {t("orders:details.orderNumber", { num: order.num })}
        </ThemedText>
      </ThemedView>

      <ThemedView style={tw`gap-2`}>
        {visibleOptions.map((option, index) => (
          <ThemedView key={index}>
            <Pressable
              onPress={option.onPress}
              disabled={option.disabled}
              style={({ pressed }) => [
                tw.style(
                  "flex-row items-center gap-3 p-3 rounded-xl",
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
                    ? tw.color("light-primary")
                    : option.color
                      ? tw.color(option.color.replace("text-", ""))
                      : tw.color("light-primary")
                }
              />
              <ThemedText
                type="body1"
                style={tw.style(
                  "flex-1",
                  option.color && !option.disabled && option.color,
                )}
              >
                {option.label}
              </ThemedText>
              {!option.disabled && (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={tw.color("gray-400")}
                />
              )}
            </Pressable>
            {option.divider && <ThemedView style={tw`h-px bg-gray-200 my-2`} />}
          </ThemedView>
        ))}
      </ThemedView>
    </BottomSheetView>
  );
};

export default OrderOptionsBottomSheet;

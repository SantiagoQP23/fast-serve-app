import { useState, useRef } from "react";
import ModifierLines from "@/presentation/orders/components/modifier-lines";
import {
  calculateUnitPrice,
  selectionFromRows,
  toCustomizationPayload,
} from "@/core/menu/models/customization.model";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Pressable, PressableProps } from "react-native";
import {
  AddAgainBlockReason,
  OrderDetail,
  OrderDetailStatus,
  getAddAgainBlockReason,
  getOrderDetailDeleteBlockReason,
  getReplaceBlockReason,
} from "@/core/orders/models/order-detail.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";
import { DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK } from "@/core/restaurant/models/restaurant-settings.model";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import InfoBottomSheet from "@/presentation/theme/components/info-bottom-sheet";
import { useOrders } from "../hooks/useOrders";
import { useOrdersStore } from "../store/useOrdersStore";
import { useReplaceOrderDetailStore } from "../store/replaceOrderDetailStore";
import {
  emitterAction,
  useRemovalAuthorization,
} from "../authorization/useRemovalAuthorization";
import { toast } from "sonner-native";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import BottomSheetPicker, {
  BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import OrderDetailActionsBottomSheet from "./order-detail-actions-bottom-sheet";
import Checkbox from "@/presentation/theme/components/checkbox";
import Icon from "@/presentation/theme/components/icon";
import { formatCurrency } from "@/core/i18n/utils";
import Label from "@/presentation/theme/components/label";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useOrderDetailStatus } from "../hooks/useOrderDetailStatus";
import { useMarkOrderDelivered } from "../hooks/useMarkOrderDelivered";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";

interface OrderDetailCardProps extends PressableProps {
  detail: OrderDetail;
  orderId?: string;
  orderUserId: string;
  orderType?: OrderType;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (detail: OrderDetail) => void;
  // When set, long-press starts selection mode instead of opening the actions sheet.
  onStartSelection?: (detail: OrderDetail) => void;
  showAmount?: boolean;
  /** A closed order's item: shown, but nothing on it can change. */
  readOnly?: boolean;
}

export default function OrderDetailCard({
  detail,
  onPress,
  orderId,
  orderUserId,
  orderType,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onStartSelection,
  showAmount = true,
  readOnly = false,
}: OrderDetailCardProps) {
  const { t } = useTranslation(["common", "orders", "errors"]);
  // The card also renders outside the active order (the orders list cards),
  // so resolve the order it belongs to rather than the last one opened.
  const order = useOrdersStore((state) =>
    !orderId || state.activeOrder?.id === orderId
      ? state.activeOrder
      : state.orders.find((o) => o.id === orderId),
  );
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const deleteBlockedSheetRef = useRef<BottomSheetMethods>(null);
  const replaceBlockedSheetRef = useRef<BottomSheetMethods>(null);
  const typePickerRef = useRef<BottomSheetPickerRef>(null);
  const { markDelivered } = useMarkOrderDelivered();

  const createdBy = detail.createdBy;
  const updatedBy = detail.updatedBy;

  const showCreatedBy = createdBy && createdBy.id !== orderUserId;
  // Owner/admin who authorized removing units of this item.
  const authorizedByName = detail.authorizedBy?.person?.firstName ?? "";
  const authorizedText = detail.authorizedAt
    ? t("orders:authorization.authorizedByAt", {
        name: authorizedByName,
        time: dayjs(detail.authorizedAt).format("HH:mm"),
      })
    : t("orders:authorization.authorizedBy", { name: authorizedByName });
  const showUpdatedBy = updatedBy && updatedBy.id !== orderUserId;

  const { mutate: updateOrderDetail } = useOrders().updateOrderDetail;

  const { mutate: removeOrderDetail } = useOrders().removeOrderDetail;
  const { authorize } = useRemovalAuthorization();
  const { mutate: addOrderDetailToOrder } = useOrders().addOrderDetailToOrder;
  const menuProduct = useMenuStore((state) =>
    state.products.find((product) => product.id === detail.product.id),
  );
  const { settings } = useRestaurantSettings();
  const { statusText, statusIconColor } = useOrderDetailStatus(detail.status);
  const isCancelled = detail.status === OrderDetailStatus.CANCELLED;
  const isDelivered = detail.status === OrderDetailStatus.DELIVERED;
  const deleteBlockReason = getOrderDetailDeleteBlockReason(detail);
  const replaceBlockReason = getReplaceBlockReason(detail);
  // Delivered is gray, matching the "default" label color used for delivered orders.
  const checkboxColor = isDelivered ? "gray-500" : statusIconColor;

  // A cancelled item can be added again while its order is still open.
  const canAddAgain =
    isCancelled &&
    !!order &&
    !order.isClosed &&
    order.status !== OrderStatus.CANCELLED;

  const getAddAgainBlockedHint = () => {
    if (!canAddAgain) return undefined;
    const blocksWithoutStock =
      (settings?.ALLOW_ORDERS_WITHOUT_STOCK ??
        DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK) === false;
    const blocked = getAddAgainBlockReason(
      detail,
      menuProduct,
      blocksWithoutStock,
    );
    if (!blocked) return undefined;
    if (blocked.reason === AddAgainBlockReason.NO_STOCK)
      return t("errors:codes.ORDER_INSUFFICIENT_STOCK", {
        productName: detail.product.name,
        available: blocked.remaining,
      });
    return t(`orders:addAgain.reasons.${blocked.reason}`);
  };

  // A price typed by hand differs from the variant plus its customizations.
  const hasCustomPrice =
    !!detail.productOption &&
    calculateUnitPrice(
      detail.basePrice ?? detail.productOption.price,
      detail.modifiers,
    ) !== Number(detail.price);

  const handleAddAgain = () => {
    if (!order || !canAddAgain) return;

    addOrderDetailToOrder({
      orderId: order.id,
      productId: detail.product.id,
      productOptionId: detail.productOption?.id,
      quantity: detail.quantity,
      price: detail.price,
      description: detail.description,
      tagIds: detail.tags?.map((tag) => tag.id) ?? [],
      typeOrderDetail: detail.typeOrderDetail,
      // Same picks again; a hand-typed price stays as it was.
      ...(detail.modifiers?.length && {
        customization: toCustomizationPayload(
          selectionFromRows(detail.modifiers),
          detail.modifiers,
          hasCustomPrice,
        ),
      }),
    });
  };

  // Only rows without long-press selection get the actions sheet, so most
  // pending rows don't mount one.
  const canOpenActions =
    !readOnly && !onStartSelection && (!isCancelled || canAddAgain);

  const handleOpenBottomSheet = () => {
    if (!canOpenActions) return;
    bottomSheetModalRef.current?.present();
  };

  const handleCloseBottomSheet = () => {
    bottomSheetModalRef.current?.dismiss();
  };

  // Delete looks the same either way; once units are billed or delivered, it
  // explains why it can't instead of asking to confirm.
  const onRemoveDetail = () => {
    if (deleteBlockReason) {
      deleteBlockedSheetRef.current?.present();
      return;
    }
    handleCloseBottomSheet();
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = () => {
    const currentOrderId = orderId || order?.id;
    if (!currentOrderId) return;

    // Removing units may need an owner/admin code; the code sheet takes
    // over from the dialog then.
    closeModal();
    void authorize(
      t("orders:authorization.summaryDelete", {
        count: detail.quantity,
        product: detail.product.name,
      }),
      emitterAction(removeOrderDetail, (code) => ({
        detailId: detail.id,
        orderId: currentOrderId,
        ...(code && { authorizationCode: code }),
      })),
    );
  };

  const startReplace = useReplaceOrderDetailStore((state) => state.start);

  const handleReplace = () => {
    const currentOrderId = orderId || order?.id;
    if (!currentOrderId) return;

    startReplace(currentOrderId, detail);
    router.push("/(new-order)/restaurant-menu");
  };

  const handleEditQuantity = () => {
    if (onPress) {
      onPress({} as any);
    }
  };

  const onCheckedChange = (checked: boolean) => {
    // Delivering goes through the shared flow so it gets the undo snackbar.
    if (checked && order) {
      markDelivered(order, [detail]);
      return;
    }

    const currentOrderId = orderId || order?.id;
    if (!currentOrderId) return;

    updateOrderDetail({
      id: detail.id,
      orderId: currentOrderId,
      status: checked
        ? OrderDetailStatus.DELIVERED
        : OrderDetailStatus.PENDING,
      qtyDelivered: checked ? detail.quantity : 0,
    });
  };

  const closeModal = () => {
    setDeleteDialogVisible(false);
  };

  const showTypeLabel = detail.typeOrderDetail !== (orderType ?? order?.type);

  const showProductOptionName =
    detail.product.options.length > 1 && detail.productOption;

  return (
    <>
      {deleteDialogVisible && (
        <DialogModal
          visible
          title={t("orders:dialogs.removeItemTitle")}
          message={t("orders:dialogs.removeItemMessage", {
            product: detail.product.name,
          })}
          confirmLabel={t("orders:dialogs.deleteConfirm")}
          confirmVariant="destructive"
          onConfirm={handleConfirmDelete}
          onCancel={closeModal}
        />
      )}

      {canOpenActions && (
        <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
          <OrderDetailActionsBottomSheet
            detail={detail}
            onEditQuantity={handleEditQuantity}
            onReplace={handleReplace}
            onReplaceBlockedInfo={() =>
              replaceBlockedSheetRef.current?.present()
            }
            onDelete={onRemoveDetail}
            onAddAgain={canAddAgain ? handleAddAgain : undefined}
            addAgainBlockedHint={getAddAgainBlockedHint()}
            onClose={handleCloseBottomSheet}
          />
        </ThemedBottomSheetModal>
      )}

      {canOpenActions && !isCancelled && replaceBlockReason && (
        <InfoBottomSheet
          ref={replaceBlockedSheetRef}
          title={t("orders:replaceItem.blocked.title")}
          message={t(`orders:replaceItem.reasons.${replaceBlockReason}`)}
        />
      )}

      {deleteBlockReason && !readOnly && !isCancelled && (
        <InfoBottomSheet
          ref={deleteBlockedSheetRef}
          title={t("orders:deleteItemBlocked.title")}
          message={t(`orders:deleteItemBlocked.reasons.${deleteBlockReason}`, {
            billed: detail.qtyPaid,
            delivered: detail.qtyDelivered,
            quantity: detail.quantity,
            product: detail.product.name,
          })}
        />
      )}

      <ThemedView style={tw``}>
        <Swipeable
          enabled={!selectionMode && !readOnly && !isCancelled}
          renderRightActions={
            isCancelled || selectionMode || readOnly
              ? undefined
              : () => (
                  // Full row height, so it isn't clipped on one-line rows.
                  <Pressable
                    onPress={onRemoveDetail}
                    accessibilityRole="button"
                    accessibilityLabel={t("orders:detailActions.deleteItem")}
                    style={({ pressed }) =>
                      tw.style(
                        "ml-2 px-5 justify-center items-center rounded-md bg-red-100",
                        pressed && "opacity-80",
                      )
                    }
                  >
                    <Icon name="trash" size={20} color={tw.color("red-700")} />
                  </Pressable>
                )
          }
        >
          <Pressable
            disabled={readOnly}
            onPress={
              isCancelled
                ? canAddAgain
                  ? handleOpenBottomSheet
                  : undefined
                : selectionMode
                  ? () => onToggleSelect?.(detail)
                  : onPress
            }
            onLongPress={
              isCancelled || selectionMode
                ? undefined
                : onStartSelection
                  ? () => onStartSelection(detail)
                  : handleOpenBottomSheet
            }
            accessibilityRole={selectionMode ? "checkbox" : "button"}
            accessibilityState={
              selectionMode ? { checked: selected } : undefined
            }
          >
            <ThemedView style={tw`flex-row  gap-4`}>
              {selectionMode && !isCancelled && (
                <Icon
                  name={selected ? "circle-check" : "circle"}
                  size={20}
                  color={selected ? tw.color("primary") : tw.color("gray-400")}
                  style={tw`mt-1`}
                />
              )}
              {!isCancelled && !selectionMode && (
                <ThemedView style={tw`mt-0.5 bg-transparent`}>
                  <Checkbox
                    value={isDelivered}
                    onValueChange={onCheckedChange}
                    color={checkboxColor}
                    size="medium"
                    disabled={readOnly}
                    accessibilityLabel={`${detail.product.name}: ${statusText}`}
                  />
                </ThemedView>
              )}
              <ThemedView style={tw` bg-transparent gap-2  flex-1`}>
                <ThemedView
                  style={tw`flex-row bg-transparent items-center gap-4`}
                >
                  <ThemedView style={tw`flex-1 bg-transparent gap-2`}>
                    <ThemedView style={tw` bg-transparent  gap-2`}>
                      <ThemedView
                        style={tw`flex-row justify-between bg-transparent gap-2 items-start`}
                      >
                        <ThemedView
                          style={tw`flex-1 flex-row flex-wrap bg-transparent gap-2 items-center`}
                        >
                          <ThemedText type="body1" style={tw`shrink`}>
                            {detail.product.name}
                            {showProductOptionName
                              ? ` ${detail.productOption?.name}`
                              : ""}
                            <ThemedText type="body1" style={tw`text-gray-500`}>
                              {` ×${detail.quantity}`}
                            </ThemedText>
                          </ThemedText>

                          {detail.productOption && hasCustomPrice && (
                              <Label
                                text={formatCurrency(detail.price)}
                                color="default"
                                size="small"
                              />
                            )}
                        </ThemedView>
                        {showAmount && (
                          <ThemedText type="body2">
                            {formatCurrency(detail.amount)}
                          </ThemedText>
                        )}
                      </ThemedView>
                      <ModifierLines modifiers={detail.modifiers} />
                      {detail.description && (
                        <ThemedText type="body2">
                          {detail.description}
                        </ThemedText>
                      )}
                      {detail.tags?.length > 0 && (
                        <ThemedView
                          style={tw`flex-row flex-wrap gap-2 bg-transparent`}
                        >
                          {detail.tags.map((tag) => (
                            <Label
                              key={tag.id}
                              text={tag.name}
                              color="default"
                              size="small"
                            />
                          ))}
                        </ThemedView>
                      )}
                    </ThemedView>
                    {!isCancelled &&
                      detail.quantity > 1 &&
                      detail.status !== OrderDetailStatus.DELIVERED && (
                        <ProgressBar
                          variant={
                            detail.quantity > 8 ? "default" : "segmented"
                          }
                          progress={detail.qtyDelivered / detail.quantity}
                          segments={detail.quantity}
                          height={1.5}
                        />
                      )}
                  </ThemedView>
                </ThemedView>
                <ThemedView style={tw`flex-row gap-2 flex-wrap gap-y-2`}>
                  {showTypeLabel && (
                    <Label
                      text={
                        detail.typeOrderDetail === OrderType.IN_PLACE
                          ? t("common:orderType.inPlace")
                          : t("common:orderType.takeAway")
                      }
                      leftIcon={
                        detail.typeOrderDetail === OrderType.IN_PLACE
                          ? "utensils"
                          : "shopping-bag"
                      }
                      color="default"
                      size="small"
                      onPress={
                        readOnly
                          ? undefined
                          : () => typePickerRef.current?.present()
                      }
                    />
                  )}

                  {showCreatedBy && (
                    <Label
                      text={detail.createdBy?.person.firstName || ""}
                      leftIcon="user"
                      size="small"
                      color="default"
                    />
                  )}
                  {showUpdatedBy && (
                    <Label
                      text={detail.updatedBy?.person.firstName || ""}
                      color="default"
                      leftIcon="user"
                      size="small"
                    />
                  )}
                  {authorizedByName && (
                    <Label
                      text={authorizedByName}
                      color="info"
                      leftIcon="shield-check"
                      size="small"
                      accessibilityLabel={authorizedText}
                      onPress={() => toast(authorizedText)}
                    />
                  )}
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </Pressable>
        </Swipeable>
      </ThemedView>

      {showTypeLabel && !readOnly && (
        <BottomSheetPicker
          ref={typePickerRef}
          title={t("orders:newOrder.orderType")}
          options={[
            { label: t("common:orderType.inPlace"), value: OrderType.IN_PLACE },
            {
              label: t("common:orderType.takeAway"),
              value: OrderType.TAKE_AWAY,
            },
          ]}
          value={detail.typeOrderDetail}
          onChange={(value) => {
            const currentOrderId = orderId || order?.id;
            if (!currentOrderId) return;
            updateOrderDetail(
              {
                id: detail.id,
                orderId: currentOrderId,
                typeOrderDetail: value as OrderType,
              },
              {
                onSuccess: () => {},
              },
            );
          }}
        />
      )}
    </>
  );
}

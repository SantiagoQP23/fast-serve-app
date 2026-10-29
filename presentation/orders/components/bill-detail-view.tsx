import { ScrollView, View, RefreshControl } from "react-native";
import { toast } from "sonner-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useBills } from "@/presentation/orders/hooks/useBills";
import IconButton from "@/presentation/theme/components/icon-button";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import Label from "@/presentation/theme/components/label";
import { Bill, BillSource, BillStatus } from "@/core/orders/models/bill.model";
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import TransactionCard from "@/presentation/transactions/components/transaction-card";
import {
  DetailCard,
  DetailCardRow,
  DetailCardTitle,
} from "@/presentation/theme/components/detail-card";
import DetailHeader from "@/presentation/theme/components/detail-header";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { useBillStatus } from "@/presentation/orders/hooks/useBillStatus";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isAdminLevelRole } from "@/core/auth/models/user.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useBillPrint } from "@/presentation/orders/hooks/useBillPrint";
import { getUserDisplayName } from "@/core/auth/utils/get-user-display-name";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import ActionsBottomSheet, {
  type ActionsBottomSheetItem,
} from "@/presentation/theme/components/actions-bottom-sheet";
import { typography } from "@/constants/theme";
import { roundTo } from "@/core/common/utils/format.util";
import {
  getBillAmountDue,
  getBillCommittedAmount,
  isSameAmount,
  parseAmount,
} from "@/core/orders/utils/bill-payment.util";
import BillLoadState from "@/presentation/orders/components/bill-load-state";

dayjs.extend(relativeTime);

const DATE_FORMAT = "DD MMM YYYY, HH:mm";

interface BillDetailViewProps {
  billId: number;
  /**
   * Rendered as a pane next to the sales list (tablet) instead of as its own
   * screen: shows a close button and closes the pane instead of navigating
   * back.
   */
  embedded?: boolean;
  onClose?: () => void;
}

export default function BillDetailView({
  billId,
  embedded = false,
  onClose,
}: BillDetailViewProps) {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const Container = embedded ? ThemedView : ScreenLayout;

  const {
    data: bill,
    isLoading,
    error: billError,
    refetch,
  } = useBills().billByIdQuery(billId);

  // Another phone edited a direct sale: refresh it if it's the one shown.
  useWebsocketEventListener<Bill>(
    OrderSocketEvent.directBillUpdated,
    ({ data }) => {
      if (data?.id === billId) refetch();
    },
  );

  const { status } = useBillStatus(bill?.status || BillStatus.OPEN);

  const setBillAmount = useOrdersStore((state) => state.setBillAmount);

  // Reset bill amount on mount so the payment flow starts fresh
  useEffect(() => {
    setBillAmount("");
  }, [setBillAmount]);

  const [discountInput, setDiscountInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const bottomSheetRef = useRef<BottomSheetMethods>(null);
  const moreOptionsSheetRef = useRef<BottomSheetMethods>(null);

  const primaryColor = useThemeColor({}, "primary");
  const { mutate: removeBill, isLoading: isRemovingBill } =
    useBills().removeBill;
  const { mutate: updateBill, isLoading: isSavingDiscount } =
    useBills().updateBill;

  const { user } = useAuthStore();
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const isCashier = user?.role?.name === Roles.CASHIER;
  const canChargeBill = isAdmin || isCashier;
  const canManage = isAdmin || isCashier;

  const { handleShareBill } = useBillPrint(bill);

  const isPaid = bill?.status === BillStatus.PAID;

  const handleEditBillPress = () => {
    if (!bill) return;
    if (bill.source === BillSource.DIRECT) {
      router.push(`/(bills)/${bill.id}/edit-sale`);
      return;
    }
    if (!bill.order) return;
    router.push(`/(bills)/${bill.id}/edit`);
  };

  const handlePrintPress = () => {
    if (bill) router.push(`/(bills)/${bill.id}/print`);
  };

  const handleOpenMoreOptions = () => {
    moreOptionsSheetRef.current?.present();
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // refetch() resolves even when the request fails; the bill already on
      // screen stays, so a toast is enough to say it may be out of date.
      const result = await refetch();
      if (result.isError) toast.error(t("bills:loadState.errorTitle"));
    } finally {
      setRefreshing(false);
    }
  }, [refetch, t]);

  if (!bill) {
    return (
      <BillLoadState
        isLoading={isLoading}
        error={billError}
        onRetry={refetch}
      />
    );
  }

  const closeModal = () => setVisible(false);
  const createdAt = dayjs(bill.createdAt);
  const updatedAt = dayjs(bill.updatedAt);
  const createdAtLabel = `${createdAt.fromNow()} · ${createdAt.format(
    "MMM D, HH:mm",
  )}`;
  const updatedAtLabel = `${updatedAt.fromNow()} · ${updatedAt.format(
    "MMM D, HH:mm",
  )}`;

  const amountDue = getBillAmountDue(bill);
  const committedAmount = getBillCommittedAmount(bill);
  const isPartiallyPaid = !isPaid && committedAmount > 0;
  // A transfer waiting for approval can cover what's left: nothing to charge,
  // but the bill isn't paid yet either.
  const isAwaitingTransfer = !isPaid && amountDue <= 0;
  const showChargeBar = !isPaid && canChargeBill;

  const onRemoveBill = () => {
    removeBill(
      { id: bill.id },
      {
        onSuccess: () => {
          closeModal();
          if (onClose) onClose();
          else router.back();
        },
      },
    );
  };

  const handlePayBillPress = () => {
    router.push(`/(bills)/${bill.id}/payment-method`);
  };

  const currentDiscount = Number(bill.discount) || 0;
  const discount5 = roundTo(bill.subtotal * 0.05, 2);
  const discount10 = roundTo(bill.subtotal * 0.1, 2);
  const maxDiscount = discount10;

  // An empty field removes the discount.
  const discountValue =
    discountInput.trim() === "" ? 0 : parseAmount(discountInput);
  const discountError = Number.isNaN(discountValue)
    ? t("bills:alerts.invalidDiscount")
    : discountValue > maxDiscount && !isSameAmount(discountValue, maxDiscount)
      ? t("bills:alerts.maxDiscountAllowed", {
          amount: formatCurrency(maxDiscount),
        })
      : undefined;
  const isDiscountUnchanged =
    !discountError && isSameAmount(discountValue, currentDiscount);

  const handleOpenDiscountSheet = () => {
    setDiscountInput(currentDiscount > 0 ? currentDiscount.toFixed(2) : "");
    bottomSheetRef.current?.present();
  };

  const handleAddDiscountFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handleOpenDiscountSheet();
  };

  const handleShareFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handleShareBill();
  };

  const handleDeleteFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    setVisible(true);
  };

  const handleSaveDiscount = () => {
    if (discountError || isDiscountUnchanged) return;
    updateBill(
      { id: bill.id, discount: roundTo(discountValue, 2) },
      {
        onSuccess: () => {
          bottomSheetRef.current?.dismiss();
          refetch();
        },
      },
    );
  };

  const openTransactionDetail = (transactionId: number) => {
    if (!canManage) {
      return;
    }
    router.push(`/transaction/${transactionId}`);
  };

  const moreOptionsItems: ActionsBottomSheetItem[] = [
    ...(!isPaid
      ? [
          {
            icon: "tag" as const,
            label: t("bills:details.addDiscount"),
            onPress: handleAddDiscountFromMenu,
          },
        ]
      : []),
    {
      icon: "share",
      label: t("common:actions.share"),
      onPress: handleShareFromMenu,
    },
    ...(!isPaid
      ? [
          {
            icon: "trash" as const,
            label: t("bills:details.deleteBill"),
            color: "text-red-600",
            onPress: handleDeleteFromMenu,
          },
        ]
      : []),
  ];

  const sourceLabel = [
    t(`bills:list.${bill.source}`, { number: bill.num }),
    bill.order && t("orders:details.orderNumber", { num: bill.order.num }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    // Anchors the absolutely positioned charge bar to this view, which matters
    // when it's a pane rather than the whole screen.
    <View style={tw`flex-1`}>
      <DialogModal
        visible={visible}
        title={t("bills:dialogs.removeTitle")}
        message={t("bills:dialogs.removeMessage")}
        onConfirm={onRemoveBill}
        onCancel={closeModal}
        confirmLabel={t("common:actions.remove")}
        confirmVariant="destructive"
        loading={isRemovingBill}
      />

      <Container style={tw`flex-1 bg-background`}>
        <ThemedView style={tw`px-4 ${embedded ? "pt-2" : "pt-6"} flex-1 gap-4`}>
          {/* Pane header: stands in for the stack header when embedded */}
          {embedded && (
            <ThemedView style={tw`flex-row items-center`}>
              <IconButton
                icon="x"
                accessibilityLabel={t("common:actions.close")}
                onPress={onClose}
                size={24}
              />
            </ThemedView>
          )}
          <ScrollView
            style={tw`flex-1`}
            contentContainerStyle={tw`gap-4 ${showChargeBar ? "pb-32" : "pb-10"}`}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={primaryColor}
                colors={[primaryColor]}
              />
            }
          >
            {/* Header: total, where it came from, and when */}
            <DetailHeader
              amount={formatCurrency(bill.total)}
              title={sourceLabel}
              subtitle={createdAt.format(DATE_FORMAT)}
              icon="receipt-text"
              badge={{
                color: status.color,
                icon: status.icon,
                label: status.text,
              }}
            >
              {/* Charging lives in the bottom bar; these are the rest */}
              <ThemedView style={tw`flex-row flex-wrap gap-3`}>
                {!isPaid && (
                  <Button
                    label={t("common:actions.edit")}
                    leftIcon="pencil"
                    variant="surface"
                    shape="rounded"
                    size="small"
                    onPress={handleEditBillPress}
                  />
                )}
                <Button
                  label={t("common:actions.print")}
                  leftIcon="printer"
                  variant="surface"
                  shape="rounded"
                  size="small"
                  onPress={handlePrintPress}
                />
                {isPaid ? (
                  <Button
                    label={t("common:actions.share")}
                    leftIcon="share"
                    variant="surface"
                    shape="rounded"
                    size="small"
                    onPress={handleShareBill}
                  />
                ) : (
                  <Button
                    leftIcon="ellipsis"
                    variant="surface"
                    shape="rounded"
                    size="small"
                    accessibilityLabel={t("bills:details.moreOptions")}
                    onPress={handleOpenMoreOptions}
                  />
                )}
              </ThemedView>
            </DetailHeader>

            {/* Info */}
            <DetailCard style={tw`py-2`}>
              <DetailCardRow label={t("common:transactions.statusLabel")}>
                <Label
                  size="small"
                  color={status.color}
                  leftIcon={status.icon}
                  text={status.text}
                />
              </DetailCardRow>
              <DetailCardRow
                label={t("common:labels.waiter")}
                value={getUserDisplayName(
                  bill.owner,
                  t("common:labels.deletedUser"),
                )}
              />
              {bill.order && (
                <DetailCardRow
                  label={t("bills:details.service")}
                  value={
                    bill.order.type === OrderType.IN_PLACE
                      ? `${t("common:labels.table")} ${bill.order.table?.name ?? ""}`.trim()
                      : t("common:labels.takeAway")
                  }
                />
              )}
              {isPartiallyPaid && (
                <>
                  <DetailCardRow
                    label={t("bills:details.paid")}
                    value={formatCurrency(committedAmount)}
                  />
                  <DetailCardRow
                    label={t("bills:details.remaining")}
                    value={formatCurrency(Math.max(amountDue, 0))}
                  />
                </>
              )}
            </DetailCard>

            {/* Products, then the totals they add up to */}
            <DetailCard style={tw`py-5 gap-4`}>
              <DetailCardTitle title={t("bills:details.products")} />
              {bill.details.map((detail) => {
                const showProductOptionName =
                  detail.product &&
                  detail.product.options.length > 1 &&
                  detail.productOption;
                const productName = [
                  bill.source === BillSource.ORDER
                    ? detail.orderDetail?.product.name
                    : detail.product?.name,
                  showProductOptionName ? detail.productOption?.name : null,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <ThemedView
                    key={detail.id}
                    style={tw`flex-row items-center gap-4`}
                  >
                    <ThemedView
                      style={tw`w-10 h-10 rounded-full items-center justify-center bg-surface`}
                    >
                      <ThemedText style={{ fontFamily: typography.semibold }}>
                        {detail.quantity}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText style={tw`flex-1`}>{productName}</ThemedText>
                    <ThemedView style={tw`items-end`}>
                      <ThemedText>{formatCurrency(detail.total)}</ThemedText>
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {detail.quantity} × {formatCurrency(detail.price)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                );
              })}

              <ThemedView>
                <DetailCardRow
                  label={t("bills:details.subtotal")}
                  value={formatCurrency(bill.subtotal)}
                />
                {currentDiscount > 0 && (
                  <DetailCardRow
                    label={t("bills:details.discount")}
                    trailing={
                      !isPaid ? (
                        <IconButton
                          icon="pencil"
                          size={16}
                          onPress={handleOpenDiscountSheet}
                          variant="text"
                          accessibilityLabel={t("bills:details.editDiscount")}
                        />
                      ) : undefined
                    }
                  >
                    <ThemedText style={tw`text-emerald-700`}>
                      -{formatCurrency(currentDiscount)}
                    </ThemedText>
                  </DetailCardRow>
                )}
                <ThemedView
                  accessible
                  accessibilityLabel={`${t("bills:details.total")}, ${formatCurrency(bill.total)}`}
                  style={tw`flex-row items-center justify-between gap-4 min-h-14 py-2`}
                >
                  <ThemedText style={{ fontFamily: typography.bold }}>
                    {t("bills:details.total")}
                  </ThemedText>
                  <ThemedText style={{ fontFamily: typography.bold }}>
                    {formatCurrency(bill.total)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </DetailCard>

            {bill.transactions.length > 0 && (
              <ThemedView style={tw`gap-3 mt-4`}>
                <ThemedText type="h3" accessibilityRole="header">
                  {t("bills:details.payments")}
                </ThemedText>
                <DetailCard style={tw`py-4 gap-4`}>
                  {bill.transactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onPress={() => openTransactionDetail(transaction.id)}
                    />
                  ))}
                </DetailCard>
              </ThemedView>
            )}

            {/* Activity */}
            <DetailCard style={tw`py-5 gap-2`}>
              <DetailCardTitle title={t("orders:details.activity")} />
              <ThemedView>
                <DetailCardRow
                  label={t("common:transactions.createdBy")}
                  value={getUserDisplayName(
                    bill.createdBy,
                    t("common:labels.deletedUser"),
                  )}
                />
                <DetailCardRow
                  label={t("orders:details.createdAt")}
                  value={createdAtLabel}
                />
                <DetailCardRow
                  label={t("orders:details.updatedAt")}
                  value={updatedAtLabel}
                />
              </ThemedView>
            </DetailCard>
          </ScrollView>
        </ThemedView>
      </Container>

      {/* Charge bar: the bill screen's one primary action, in thumb reach */}
      {showChargeBar && (
        <ThemedView
          style={[
            tw`absolute bottom-0 left-0 right-0 bg-background border-t border-divider px-4 pt-3`,
            { paddingBottom: embedded ? 16 : Math.max(insets.bottom, 16) },
          ]}
        >
          {isAwaitingTransfer ? (
            <ThemedView style={tw`items-center py-3`}>
              <Label
                color="warning"
                leftIcon="hourglass"
                text={t("bills:details.awaitingTransfer")}
              />
            </ThemedView>
          ) : (
            <Button
              label={t("bills:details.chargeAmount", {
                amount: formatCurrency(amountDue),
              })}
              onPress={handlePayBillPress}
            />
          )}
        </ThemedView>
      )}

      {/* Discount Bottom Sheet */}
      <ThemedBottomSheetModal ref={bottomSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`p-4 gap-4`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h3" style={tw`text-center`}>
              {t("bills:details.discount")}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-500 text-center`}>
              {t("bills:alerts.maxDiscountAllowed", {
                amount: formatCurrency(maxDiscount),
              })}
            </ThemedText>
          </ThemedView>

          <TextInput
            inputMode="decimal"
            bottomSheet
            value={discountInput}
            onChangeText={setDiscountInput}
            placeholder="0.00"
            icon="tag"
            error={discountError}
          />

          <ThemedView style={tw`flex-row gap-2`}>
            <Button
              label={`5%`}
              variant={
                isSameAmount(discountValue, discount5) ? "secondary" : "outline"
              }
              onPress={() => setDiscountInput(discount5.toFixed(2))}
            />
            <Button
              label={`10%`}
              variant={
                isSameAmount(discountValue, discount10)
                  ? "secondary"
                  : "outline"
              }
              onPress={() => setDiscountInput(discount10.toFixed(2))}
            />
          </ThemedView>

          <Button
            label={t("common:actions.save")}
            onPress={handleSaveDiscount}
            disabled={!!discountError || isDiscountUnchanged}
            loading={isSavingDiscount}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      {/* More Options Bottom Sheet */}
      <ThemedBottomSheetModal ref={moreOptionsSheetRef} enablePanDownToClose>
        <ActionsBottomSheet items={moreOptionsItems} />
      </ThemedBottomSheetModal>
    </View>
  );
}

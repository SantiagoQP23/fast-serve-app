import { ScrollView, View, RefreshControl } from "react-native";
import { toast } from "sonner-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useNavigation } from "expo-router";
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
import Icon from "@/presentation/theme/components/icon";
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
  const navigation = useNavigation();
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

  // Edit, Print and More sit in the header so the bottom of the screen is
  // free for the one action that matters here: charging the bill. A paid bill
  // can only be printed or shared, so Share is shown directly.
  const renderHeaderActions = () =>
    bill ? (
      <ThemedView style={tw`flex-row items-center bg-transparent`}>
        {!isPaid && (
          <IconButton
            icon="pencil"
            size={22}
            onPress={handleEditBillPress}
            accessibilityLabel={t("common:actions.edit")}
          />
        )}
        <IconButton
          icon="printer"
          size={22}
          onPress={handlePrintPress}
          accessibilityLabel={t("common:actions.print")}
        />
        {isPaid ? (
          <IconButton
            icon="share"
            size={22}
            onPress={handleShareBill}
            accessibilityLabel={t("common:actions.share")}
          />
        ) : (
          <IconButton
            icon="ellipsis-vertical"
            size={22}
            onPress={handleOpenMoreOptions}
            accessibilityLabel={t("bills:details.moreOptions")}
          />
        )}
      </ThemedView>
    ) : null;

  useEffect(() => {
    // Embedded in another screen: actions render inline in the pane header
    if (embedded) return;

    navigation.setOptions({
      headerRight: renderHeaderActions,
    });
    // renderHeaderActions is rebuilt every render; the values it reads are
    // listed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, navigation, bill, isPaid, handleShareBill, t]);

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
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <IconButton
                icon="x"
                accessibilityLabel={t("common:actions.close")}
                onPress={onClose}
                size={24}
              />
              {renderHeaderActions()}
            </ThemedView>
          )}
          <ScrollView
            style={tw`flex-1`}
            contentContainerStyle={tw`${showChargeBar ? "pb-32" : "pb-10"}`}
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
            {/* Header Section */}
            <ThemedView style={tw`mb-4`}>
              <ThemedText type="caption" style={tw`text-gray-500 mb-2`}>
                {sourceLabel}
              </ThemedText>

              <ThemedText
                type="h1"
                // h1 fixes its height for 32px text; size the box for the 48px
                // total. Height equal to line height keeps it scaling with the
                // font size setting.
                style={[
                  tw`text-5xl`,
                  {
                    fontFamily: typography.regular,
                    lineHeight: 58,
                    height: 58,
                  },
                ]}
              >
                {formatCurrency(bill.total)}
              </ThemedText>

              {isPartiallyPaid && (
                <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
                  {t("bills:details.paidAndRemaining", {
                    paid: formatCurrency(committedAmount),
                    remaining: formatCurrency(amountDue),
                  })}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView
              style={tw`mb-6 flex-row gap-2 items-center flex-wrap gap-y-2`}
            >
              <Label
                color={status.color}
                size="small"
                text={status.text}
                leftIcon={status.icon}
              />
              <Label
                text={getUserDisplayName(
                  bill.owner,
                  t("common:labels.deletedUser"),
                )}
                color="default"
                leftIcon="user"
                size="small"
              />

              {bill.order && (
                <Label
                  text={
                    bill.order.type === OrderType.IN_PLACE
                      ? `${t("common:labels.table")} ${bill.order.table?.name}`
                      : t("common:labels.takeAway")
                  }
                  color="default"
                  leftIcon={
                    bill.order.type === OrderType.IN_PLACE ? "utensils" : "bike"
                  }
                  size="small"
                />
              )}
            </ThemedView>

            {/* Items List */}
            <ThemedView style={tw`mb-6`}>
              {bill.details.map((detail) => {
                const showProductOptionName =
                  detail.product &&
                  detail.product.options.length > 1 &&
                  detail.productOption;

                return (
                  <ThemedView
                    key={detail.id}
                    style={tw`flex-row justify-between items-center px-4 py-1`}
                  >
                    <ThemedView style={tw`flex-1 flex-row items-center gap-3`}>
                      <ThemedText
                        type="body1"
                        style={tw`min-w-8 text-gray-600`}
                      >
                        {detail.quantity}
                      </ThemedText>
                      <ThemedText type="body1" style={tw`flex-1 text-gray-600`}>
                        {bill.source === BillSource.ORDER
                          ? detail.orderDetail?.product.name
                          : detail.product?.name}{" "}
                        {showProductOptionName && detail.productOption?.name}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText
                      type="body1"
                      style={tw`font-semibold text-gray-600`}
                    >
                      {formatCurrency(detail.total)}
                    </ThemedText>
                  </ThemedView>
                );
              })}
            </ThemedView>

            {currentDiscount > 0 && (
              <ThemedView style={tw`mb-4`}>
                {/* Subtotal */}
                <ThemedView
                  style={tw`flex-row justify-between items-center px-4`}
                >
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("bills:details.subtotal")}
                  </ThemedText>
                  <ThemedText type="body1" style={tw`font-semibold`}>
                    {formatCurrency(bill.subtotal)}
                  </ThemedText>
                </ThemedView>

                {/* Discount row */}
                <ThemedView
                  style={tw`flex-row justify-between items-center px-4 py-3`}
                >
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <ThemedText type="body2" style={tw`text-gray-500`}>
                      {t("bills:details.discount")}
                    </ThemedText>
                    {!isPaid && (
                      <IconButton
                        icon="pencil"
                        size={16}
                        onPress={handleOpenDiscountSheet}
                        variant="text"
                        accessibilityLabel={t("bills:details.editDiscount")}
                      />
                    )}
                  </ThemedView>
                  <ThemedText
                    type="body1"
                    style={tw`font-semibold text-emerald-700`}
                  >
                    -{formatCurrency(currentDiscount)}
                  </ThemedText>
                </ThemedView>

                <ThemedView
                  style={tw`flex-row justify-between items-center px-4`}
                >
                  <ThemedText type="body1" style={tw`font-semibold`}>
                    {t("bills:details.total")}
                  </ThemedText>
                  <ThemedText type="h3" style={tw`font-bold`}>
                    {formatCurrency(bill.total)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            )}

            {bill.transactions.length > 0 && (
              <>
                <ThemedText type="caption" style={tw`mb-3 mt-4`}>
                  {t("bills:details.payments")}
                </ThemedText>
                <ThemedView style={tw`gap-4`}>
                  {bill.transactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onPress={() => openTransactionDetail(transaction.id)}
                    />
                  ))}
                </ThemedView>
              </>
            )}

            <ThemedView style={tw`mt-10`}>
              <ThemedText type="caption">
                {t("orders:details.activity")}
              </ThemedText>
              <ThemedView style={tw`mt-3 gap-2`}>
                <ThemedView>
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <Icon
                      name="circle"
                      size={12}
                      color={tw.color("gray-500")}
                    />
                    <ThemedText type="body2" style={tw`text-gray-600`}>
                      {t("orders:detailInfo.createdBy", {
                        name: getUserDisplayName(
                          bill.createdBy,
                          t("common:labels.deletedUser"),
                        ),
                      })}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText type="small" style={tw`text-gray-500 ml-5`}>
                    {createdAtLabel}
                  </ThemedText>
                </ThemedView>
                <ThemedView>
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <Icon
                      name="circle"
                      size={12}
                      color={tw.color("gray-500")}
                    />
                    <ThemedText type="body2" style={tw`text-gray-600`}>
                      {t("orders:details.updatedAt")}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText type="small" style={tw`text-gray-500 ml-5`}>
                    {updatedAtLabel}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
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
            <ThemedView style={tw`flex-row items-center gap-3 py-3`}>
              <Icon name="hourglass" size={20} />
              <ThemedText type="body2" style={tw`flex-1 text-gray-600`}>
                {t("bills:details.awaitingTransfer")}
              </ThemedText>
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

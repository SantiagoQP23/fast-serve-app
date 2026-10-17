import { ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useEffect, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { toast } from "sonner-native";
import { generateIdempotencyKey } from "@/helpers/idempotency";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Card from "@/presentation/theme/components/card";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import {
  EditSaleLine,
  useEditSaleStore,
} from "@/presentation/orders/store/editSaleStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { BillStatus } from "@/core/orders/models/bill.model";
import { TransactionStatus } from "@/core/transactions/models/transaction-status.enum";

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export default function EditSaleScreen() {
  const { t } = useTranslation(["common", "bills"]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const billId = Number(id);

  const { data: bill, isLoading } = useBills().billByIdQuery(billId);
  const {
    mutate: editDirectBill,
    isLoading: isSaving,
    isOnline,
  } = useBills().editDirectBill;

  const storeBillId = useEditSaleStore((state) => state.billId);
  const lines = useEditSaleStore((state) => state.lines);
  const init = useEditSaleStore((state) => state.init);
  const setQuantity = useEditSaleStore((state) => state.setQuantity);
  const removeLine = useEditSaleStore((state) => state.removeLine);
  const reset = useEditSaleStore((state) => state.reset);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);

  // Load the sale's lines once; later refetches must not undo the edits.
  useEffect(() => {
    if (bill && storeBillId !== bill.id) init(bill);
  }, [bill, storeBillId, init]);

  // The screen stays mounted while the menu is open, so this only runs when
  // the user actually leaves the edit.
  useEffect(() => reset, [reset]);

  const { paidAmount, hasPendingTransfer } = useMemo(() => {
    const transactions = bill?.transactions ?? [];
    return {
      paidAmount: roundMoney(
        transactions
          .filter((tr) => tr.status === TransactionStatus.COMPLETED)
          .reduce((acc, tr) => acc + Number(tr.amount), 0),
      ),
      hasPendingTransfer: transactions.some(
        (tr) =>
          tr.status === TransactionStatus.PENDING_PROOF ||
          tr.status === TransactionStatus.PENDING_APPROVAL,
      ),
    };
  }, [bill?.transactions]);

  const subtotal = roundMoney(
    lines.reduce((acc, line) => acc + line.quantity * line.price, 0),
  );
  const discount = Number(bill?.discount) || 0;
  const total = roundMoney(subtotal - discount);
  const itemCount = lines.reduce((acc, line) => acc + line.quantity, 0);

  const blockReason = !isOnline
    ? t("bills:editSale.offline")
    : hasPendingTransfer
      ? t("bills:editSale.transferPending")
      : lines.length === 0
        ? t("bills:editSale.noItems")
        : discount > subtotal
          ? t("bills:editSale.discountExceedsSubtotal")
          : total < paidAmount
            ? t("bills:editSale.totalBelowPaid", {
                amount: formatCurrency(paidAmount),
              })
            : null;

  const openMenu = () => {
    setActiveProduct(null);
    setActiveDetail(null);
    router.push("/(new-order)/restaurant-menu");
  };

  const onSave = () => {
    if (blockReason || !bill) return;

    editDirectBill(
      {
        billId,
        operationId: generateIdempotencyKey(),
        details: lines.map((line) =>
          line.billDetailId
            ? { billDetailId: line.billDetailId, quantity: line.quantity }
            : {
                productId: line.product!.id,
                productOptionId: line.productOption!.id,
                quantity: line.quantity,
                price: line.price,
              },
        ),
      },
      {
        onSuccess: () => {
          router.back();
          toast.success(t("bills:editSale.saved"), {
            action: {
              label: t("bills:editSale.reprint"),
              onClick: () => router.push(`/(bills)/${billId}/print`),
            },
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="body2" style={tw`text-gray-400`}>
          {t("common:status.loading")}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!bill || bill.status === BillStatus.PAID) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("bills:list.noBills")}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pt-6 pb-48`}
      >
        <ThemedView style={tw`mb-6`}>
          <ThemedText type="h2" style={tw`mb-1`}>
            {t("bills:editSale.title")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("bills:list.direct", { number: bill.num })}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`gap-4 mb-6`}>
          {lines.map((line) => (
            <EditSaleLineCard
              key={line.key}
              line={line}
              onChange={(quantity) => setQuantity(line.key, quantity)}
              onRemove={() => removeLine(line.key)}
            />
          ))}
        </ThemedView>

        <Button
          variant="outline"
          leftIcon="add-outline"
          label={t("bills:editSale.addProducts")}
          onPress={openMenu}
        />
      </ScrollView>

      <ThemedView
        style={tw`absolute bottom-0 left-0 right-0 bg-surface-bright border-t border-gray-200 px-4 py-4 gap-1`}
      >
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="caption" style={tw`text-gray-600`}>
            {t("bills:editSale.items", { count: itemCount })}
          </ThemedText>
          <ThemedText type="h3">{formatCurrency(total)}</ThemedText>
        </ThemedView>
        {discount > 0 && (
          <ThemedText type="caption" style={tw`text-gray-500 text-right`}>
            {t("bills:editSale.discount", {
              amount: formatCurrency(discount),
            })}
          </ThemedText>
        )}
        {paidAmount > 0 && (
          <ThemedText type="caption" style={tw`text-gray-500 text-right`}>
            {t("bills:editSale.paid", { amount: formatCurrency(paidAmount) })}
          </ThemedText>
        )}
        {blockReason && (
          <ThemedText type="caption" style={tw`text-red-600 mb-1`}>
            {blockReason}
          </ThemedText>
        )}
        <Button
          style={tw`mt-2`}
          label={t("bills:editSale.save")}
          onPress={onSave}
          disabled={isSaving || !!blockReason}
          loading={isSaving}
        />
      </ThemedView>
    </ScreenLayout>
  );
}

function EditSaleLineCard({
  line,
  onChange,
  onRemove,
}: {
  line: EditSaleLine;
  onChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const showOptionName =
    !!line.productOption && (line.product?.options?.length ?? 0) > 1;

  return (
    <Card style={tw`p-5 rounded-3xl gap-3`} variant="outline">
      <ThemedView
        style={tw`flex-row justify-between items-center bg-transparent gap-2`}
      >
        <ThemedView style={tw`bg-transparent flex-1`}>
          <ThemedText type="body1" style={tw`font-semibold mb-1`}>
            {line.product?.name}
            {showOptionName && ` ${line.productOption?.name}`}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {formatCurrency(line.price)}
          </ThemedText>
        </ThemedView>
        <IconButton
          icon="trash-outline"
          onPress={onRemove}
          variant="destructive"
          style={tw`p-2`}
        />
      </ThemedView>
      <ThemedView
        style={tw`flex-row justify-between items-center bg-transparent`}
      >
        <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
          <IconButton
            icon="remove-outline"
            variant="outlined"
            onPress={() => onChange(line.quantity - 1)}
            disabled={line.quantity <= 1}
            style={tw`p-2`}
          />
          <ThemedText type="h4" style={tw`min-w-8 text-center`}>
            {line.quantity}
          </ThemedText>
          <IconButton
            icon="add-outline"
            variant="outlined"
            onPress={() => onChange(line.quantity + 1)}
            style={tw`p-2`}
          />
        </ThemedView>
        <ThemedText type="body1">
          {formatCurrency(roundMoney(line.quantity * line.price))}
        </ThemedText>
      </ThemedView>
    </Card>
  );
}

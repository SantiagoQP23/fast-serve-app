import { useRef, useState } from "react";
import dayjs from "dayjs";
import { RefreshControl, ScrollView } from "react-native";
import Icon from "@/presentation/theme/components/icon";
import { toast } from "sonner-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import IconButton from "@/presentation/theme/components/icon-button";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import InventoryDetailTitle, {
  formatDetailMoment,
} from "@/presentation/inventory/components/inventory-detail-title";
import InventorySectionHeader from "@/presentation/inventory/components/inventory-section-header";
import InventoryActivity from "@/presentation/inventory/components/inventory-activity";
import PurchaseLineCard from "@/presentation/inventory/components/purchase-line-card";
import PurchaseQuantityModal, {
  type PurchaseQuantityTarget,
} from "@/presentation/inventory/components/purchase-quantity-modal";
import { useInventoryPurchase } from "@/presentation/inventory/hooks/useInventoryPurchases";
import {
  getPurchaseCreatorName,
  type InventoryPurchaseItem,
} from "@/core/inventory/models/inventory-purchase.model";

interface InventoryPurchaseDetailViewProps {
  purchaseId: string;
  /** Rendered as a pane next to the purchases list (tablet): shows a close button. */
  embedded?: boolean;
  onClose?: () => void;
}

export default function InventoryPurchaseDetailView({
  purchaseId,
  embedded = false,
  onClose,
}: InventoryPurchaseDetailViewProps) {
  const { t } = useTranslation("inventory");
  const Container = embedded ? ThemedView : ScreenLayout;
  const { purchase, purchaseQuery, updateItem, removeItem } =
    useInventoryPurchase(purchaseId);
  const [lineToEdit, setLineToEdit] = useState<InventoryPurchaseItem | null>(
    null,
  );
  const [lineToRemove, setLineToRemove] =
    useState<InventoryPurchaseItem | null>(null);
  const hintSheetRef = useRef<BottomSheetMethods>(null);

  const lines = purchase?.items ?? [];
  const creator = purchase ? getPurchaseCreatorName(purchase) : null;

  // Editing or removing a line is the only way a purchase changes after
  // it's registered, so the latest touch on the purchase or any line counts.
  const updatedAt = purchase
    ? [purchase.updatedAt, ...lines.map((line) => line.updatedAt)]
        .filter((date): date is string => !!date)
        .sort()
        .pop()
    : undefined;
  const wasUpdated =
    !!purchase &&
    !!updatedAt &&
    !dayjs(updatedAt).isSame(purchase.createdAt, "minute");
  const activity = purchase
    ? [
        {
          label: creator
            ? t("purchases.registeredBy", { name: creator })
            : t("activity.registered"),
          date: purchase.createdAt,
        },
        ...(wasUpdated && updatedAt
          ? [{ label: t("activity.updated"), date: updatedAt }]
          : []),
      ]
    : [];

  // The item's stock already includes this line, so the preview starts
  // from the stock it would have without it.
  const editTarget: PurchaseQuantityTarget | null = lineToEdit
    ? {
        item: lineToEdit.inventoryItem,
        quantity: lineToEdit.quantity,
        baseStock: lineToEdit.inventoryItem.quantity - lineToEdit.quantity,
      }
    : null;

  const handleConfirmEdit = async (quantity: number) => {
    if (!lineToEdit) return;
    if (quantity !== lineToEdit.quantity) {
      try {
        await updateItem.mutateAsync({ itemId: lineToEdit.id, quantity });
      } catch {
        return; // useInventoryPurchase already shows the error toast
      }
    }
    setLineToEdit(null);
  };

  const handleRequestRemove = (line: InventoryPurchaseItem) => {
    if (lines.length <= 1) {
      toast.error(t("purchases.lastItemError"));
      return;
    }
    setLineToRemove(line);
  };

  const handleConfirmRemove = async () => {
    if (!lineToRemove) return;
    try {
      await removeItem.mutateAsync(lineToRemove.id);
    } catch {
      // useInventoryPurchase already shows the error toast
    }
    setLineToRemove(null);
  };

  return (
    <Container style={tw`flex-1 bg-background`}>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
        <InventoryScreenHeader
          onBack={onClose}
          backIcon={embedded ? "x" : "arrow-left"}
          right={
            <IconButton
              icon="info"
              size={24}
              accessibilityLabel={t("purchases.hintTitle")}
              onPress={() => hintSheetRef.current?.present()}
            />
          }
        />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-6 pb-10 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={purchaseQuery.isRefetching}
            onRefresh={purchaseQuery.refetch}
          />
        }
      >
        {purchaseQuery.isLoading && (
          <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
            {t("loading")}
          </ThemedText>
        )}

        {purchaseQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("purchases.notFound")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => purchaseQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {purchase && (
          <>
            <InventoryDetailTitle
              icon="receipt-text"
              title={t("purchases.name")}
              subtitle={formatDetailMoment(purchase.createdAt)}
            />

            {purchase.note && (
              <ThemedView style={tw`gap-2 bg-transparent`}>
                <ThemedView
                  style={tw`flex-row items-center gap-2 bg-transparent`}
                >
                  <Icon
                    name="file-text"
                    size={16}
                    color={tw.color("gray-500")}
                  />
                  <ThemedText
                    type="caption"
                    style={tw`text-gray-500 font-semibold`}
                  >
                    {t("common:labels.notes")}
                  </ThemedText>
                </ThemedView>
                <ThemedText type="body1" style={tw`text-gray-700`}>
                  {purchase.note}
                </ThemedText>
              </ThemedView>
            )}

            <ThemedView style={tw`gap-4 bg-transparent`}>
              <InventorySectionHeader
                title={t("purchases.products")}
                count={lines.length}
              />
              <ThemedView style={tw`gap-2 bg-transparent`}>
                {lines.map((line) => (
                  <PurchaseLineCard
                    key={line.id}
                    item={line.inventoryItem}
                    quantity={line.quantity}
                    onPress={() => setLineToEdit(line)}
                    onRemove={() => handleRequestRemove(line)}
                  />
                ))}
              </ThemedView>
            </ThemedView>

            <InventoryActivity entries={activity} />
          </>
        )}
      </ScrollView>

      <PurchaseQuantityModal
        target={editTarget}
        loading={updateItem.isPending}
        onConfirm={handleConfirmEdit}
        onClose={() => setLineToEdit(null)}
      />

      <DialogModal
        visible={!!lineToRemove}
        title={t("purchases.removeItemTitle")}
        message={
          lineToRemove
            ? t("purchases.removeItemMessage", {
                quantity: lineToRemove.quantity,
                unit: t(`units.${lineToRemove.inventoryItem.unit}`, {
                  count: lineToRemove.quantity,
                }),
                name: lineToRemove.inventoryItem.name,
              })
            : ""
        }
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={removeItem.isPending}
        onConfirm={handleConfirmRemove}
        onCancel={() => setLineToRemove(null)}
      />

      <ThemedBottomSheetModal ref={hintSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 gap-2`}>
          <ThemedText type="h3">{t("purchases.hintTitle")}</ThemedText>
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {t("purchases.editHint")}
          </ThemedText>
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </Container>
  );
}

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { router } from "expo-router";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ROUTES } from "@/constants/routes";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import ActionsBottomSheet, {
  type ActionsBottomSheetItem,
} from "@/presentation/theme/components/actions-bottom-sheet";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import NewOrderBottomSheet from "../new-order-bottom-sheet";
import {
  type CartType,
  type NewOrderState,
  useNewOrderStore,
} from "../store/newOrderStore";

export type CartActionsSheetsRef = {
  present: () => void;
};

type ConvertMode = "merge" | "replace";

/** The order fields the new-order sheet edits, to undo them on cancel. */
type OrderFieldsSnapshot = Pick<
  NewOrderState,
  "orderType" | "table" | "people"
>;

/** Order data a sale can't keep. */
const hasOrderOnlyData = (state: NewOrderState) =>
  !!state.table ||
  !!state.notes.trim() ||
  !!state.deliveryTime ||
  state.details.some(
    (detail) => !!detail.description?.trim() || !!detail.tagIds?.length,
  );

/**
 * The cart's options: turn the draft into the other kind (sale ↔ order) and
 * clear it. Turning into an order asks where it goes and for how many people
 * with the new-order sheet; if the other draft already has products, it first
 * asks whether to combine with them or replace them.
 */
const CartActionsSheets = forwardRef<CartActionsSheetsRef>((_, ref) => {
  const { t } = useTranslation(["common", "orders"]);
  const cartType = useNewOrderStore((state) => state.cartType);
  const hasDetails = useNewOrderStore((state) => state.details.length > 0);
  const convertTo = useNewOrderStore((state) => state.convertTo);
  const reset = useNewOrderStore((state) => state.reset);

  const optionsSheetRef = useRef<BottomSheetMethods>(null);
  const orderSheetRef = useRef<BottomSheetMethods>(null);
  // Set while the new-order sheet converts the sale; cleared on confirm.
  const orderSnapshotRef = useRef<OrderFieldsSnapshot | null>(null);
  const convertModeRef = useRef<ConvertMode>("merge");

  const [existingDialog, setExistingDialog] = useState<{
    target: CartType;
    count: number;
    dropsOrderData: boolean;
  } | null>(null);
  const [dropsDataDialogVisible, setDropsDataDialogVisible] = useState(false);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    present: () => optionsSheetRef.current?.present(),
  }));

  const target: CartType = cartType === "order" ? "sale" : "order";

  const presentOrderSheet = (mode: ConvertMode) => {
    const { orderType, table, people } = useNewOrderStore.getState();
    convertModeRef.current = mode;
    orderSnapshotRef.current = { orderType, table, people };
    orderSheetRef.current?.present();
  };

  const finishConvert = (to: CartType, mode: ConvertMode) => {
    if (to === "order") presentOrderSheet(mode);
    else convertTo("sale", mode);
  };

  const handleConvert = () => {
    optionsSheetRef.current?.dismiss();
    const state = useNewOrderStore.getState();
    const dropsOrderData = target === "sale" && hasOrderOnlyData(state);
    const count = state.parked.details.length;
    if (count > 0) {
      setExistingDialog({ target, count, dropsOrderData });
      return;
    }
    if (dropsOrderData) {
      setDropsDataDialogVisible(true);
      return;
    }
    finishConvert(target, "replace");
  };

  const handleExistingChoice = (mode: ConvertMode) => {
    const dialog = existingDialog;
    setExistingDialog(null);
    if (dialog) finishConvert(dialog.target, mode);
  };

  const handleConfirmOrder = () => {
    orderSnapshotRef.current = null;
    convertTo("order", convertModeRef.current);
    orderSheetRef.current?.dismiss();
  };

  // Closing the sheet without converting leaves the order draft as it was.
  const handleOrderSheetDismiss = () => {
    const snapshot = orderSnapshotRef.current;
    orderSnapshotRef.current = null;
    if (!snapshot) return;
    const { setOrderType, setTable, setPeople } = useNewOrderStore.getState();
    setOrderType(snapshot.orderType);
    setTable(snapshot.table);
    setPeople(snapshot.people);
  };

  const handleClear = () => {
    const type = cartType;
    reset();
    setClearDialogVisible(false);
    router.replace({
      pathname: ROUTES.APP.MY_ORDERS,
      params: { module: type === "sale" ? "sales" : "orders" },
    });
  };

  const items: ActionsBottomSheetItem[] = [
    ...(hasDetails
      ? [
          {
            icon: "arrow-left-right" as const,
            label: t(
              target === "sale"
                ? "orders:draft.convertToSale"
                : "orders:draft.convertToOrder",
            ),
            onPress: handleConvert,
          },
        ]
      : []),
    {
      icon: "trash",
      label: t("orders:draft.clear"),
      color: "text-red-500",
      disabled: !hasDetails,
      onPress: () => {
        optionsSheetRef.current?.dismiss();
        setClearDialogVisible(true);
      },
    },
  ];

  const existingMessage = existingDialog
    ? [
        t("orders:draft.existingMessage", { count: existingDialog.count }),
        existingDialog.dropsOrderData
          ? t("orders:draft.saleDropsOrderData")
          : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";

  return (
    <>
      <ThemedBottomSheetModal ref={optionsSheetRef} enablePanDownToClose>
        <ActionsBottomSheet title={t("orders:draft.options")} items={items} />
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal
        ref={orderSheetRef}
        enablePanDownToClose
        onDismiss={handleOrderSheetDismiss}
      >
        <NewOrderBottomSheet
          title={t("orders:draft.convertToOrder")}
          onConfirm={handleConfirmOrder}
          buttonProps={{ label: t("orders:draft.convertToOrder") }}
        />
      </ThemedBottomSheetModal>

      <DialogModal
        visible={!!existingDialog}
        title={t(
          existingDialog?.target === "order"
            ? "orders:draft.existingOrderTitle"
            : "orders:draft.existingSaleTitle",
        )}
        message={existingMessage}
        secondaryLabel={t("orders:draft.replace")}
        onSecondary={() => handleExistingChoice("replace")}
        confirmLabel={t("orders:draft.combine")}
        onConfirm={() => handleExistingChoice("merge")}
        onCancel={() => setExistingDialog(null)}
      />

      <DialogModal
        visible={dropsDataDialogVisible}
        title={t("orders:draft.convertToSale")}
        message={t("orders:draft.saleDropsOrderData")}
        confirmLabel={t("orders:draft.convert")}
        onConfirm={() => {
          setDropsDataDialogVisible(false);
          finishConvert("sale", "replace");
        }}
        onCancel={() => setDropsDataDialogVisible(false)}
      />

      <DialogModal
        visible={clearDialogVisible}
        title={t("orders:dialogs.resetCartTitle")}
        message={t(
          cartType === "sale"
            ? "orders:draft.clearSaleMessage"
            : "orders:dialogs.resetCartMessage",
        )}
        onConfirm={handleClear}
        onCancel={() => setClearDialogVisible(false)}
        confirmLabel={t("common:actions.clear")}
        confirmVariant="destructive"
      />
    </>
  );
});

CartActionsSheets.displayName = "CartActionsSheets";

export default CartActionsSheets;

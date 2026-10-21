import { forwardRef, useImperativeHandle, useRef } from "react";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import ActionsBottomSheet, {
  type ActionsBottomSheetItem,
} from "@/presentation/theme/components/actions-bottom-sheet";
import { useNewOrderStore } from "../store/newOrderStore";
import CartTypeChangeSheets, {
  type CartTypeChangeSheetsRef,
} from "./cart-type-change-sheets";

export type CartOptionsBottomSheetRef = {
  present: () => void;
};

/**
 * Options for the order being built in the cart: change its type and its
 * table (see `CartTypeChangeSheets` for the steps a type change takes).
 */
const CartOptionsBottomSheet = forwardRef<CartOptionsBottomSheetRef>(
  (_, ref) => {
    const { t } = useTranslation(["common", "orders"]);
    const orderType = useNewOrderStore((state) => state.orderType);

    const optionsSheetRef = useRef<BottomSheetMethods>(null);
    const typeChangeRef = useRef<CartTypeChangeSheetsRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => optionsSheetRef.current?.present(),
    }));

    const otherType =
      orderType === OrderType.IN_PLACE
        ? OrderType.TAKE_AWAY
        : OrderType.IN_PLACE;

    const handleChangeType = () => {
      optionsSheetRef.current?.dismiss();
      typeChangeRef.current?.changeType(otherType);
    };

    const handleChangeTable = () => {
      optionsSheetRef.current?.dismiss();
      typeChangeRef.current?.changeTable();
    };

    const items: ActionsBottomSheetItem[] = [
      {
        icon: "arrow-left-right",
        label: t("orders:options.changeType", {
          type: t(
            otherType === OrderType.IN_PLACE
              ? "common:orderType.inPlace"
              : "common:orderType.takeAway",
          ),
        }),
        onPress: handleChangeType,
      },
      ...(orderType === OrderType.IN_PLACE
        ? [
            {
              icon: "layout-grid" as const,
              label: t("orders:options.changeTable"),
              onPress: handleChangeTable,
            },
          ]
        : []),
    ];

    return (
      <>
        <ThemedBottomSheetModal ref={optionsSheetRef} enablePanDownToClose>
          <ActionsBottomSheet items={items} />
        </ThemedBottomSheetModal>

        <CartTypeChangeSheets ref={typeChangeRef} />
      </>
    );
  },
);

CartOptionsBottomSheet.displayName = "CartOptionsBottomSheet";

export default CartOptionsBottomSheet;

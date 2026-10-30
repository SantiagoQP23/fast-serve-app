import { useRef } from "react";
import { View } from "react-native";

import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import ButtonGroup from "@/presentation/theme/components/button-group";
import OptionRow from "@/presentation/theme/components/option-row";
import { useNewOrderStore } from "../store/newOrderStore";
import PeopleBottomSheet, {
  type PeopleBottomSheetRef,
} from "./people-bottom-sheet";
import DeliveryTimeBottomSheet, {
  type DeliveryTimeBottomSheetRef,
} from "./delivery-time-bottom-sheet";
import DeliveryTimeOptions from "./delivery-time-options";
import CartTypeChangeSheets, {
  type CartTypeChangeSheetsRef,
} from "./cart-type-change-sheets";

/**
 * The order being built in the cart, edited in place: each row opens a sheet
 * that writes straight to the new-order store, so there's nothing to save.
 */
export default function CartInformation() {
  const { t } = useTranslation(["common", "orders"]);
  const orderType = useNewOrderStore((state) => state.orderType);
  const table = useNewOrderStore((state) => state.table);
  const people = useNewOrderStore((state) => state.people);
  const setPeople = useNewOrderStore((state) => state.setPeople);
  const deliveryTime = useNewOrderStore((state) => state.deliveryTime);
  const setDeliveryTime = useNewOrderStore((state) => state.setDeliveryTime);

  // Type and table changes take the same steps as the cart's options sheet.
  const typeChangeRef = useRef<CartTypeChangeSheetsRef>(null);
  const peopleSheetRef = useRef<PeopleBottomSheetRef>(null);
  const deliveryTimeSheetRef = useRef<DeliveryTimeBottomSheetRef>(null);

  return (
    <>
      <ThemedView style={tw`gap-2`}>
        {/* Hugs its content; the order type is a quick toggle. */}
        <ThemedView style={tw`flex-row`}>
          <ButtonGroup
            options={[
              {
                label: t("common:orderType.inPlace"),
                value: OrderType.IN_PLACE,
                icon: "utensils",
              },
              {
                label: t("common:orderType.takeAway"),
                value: OrderType.TAKE_AWAY,
                icon: "shopping-bag",
              },
            ]}
            size="small"
            selected={orderType}
            onChange={(value: OrderType) =>
              typeChangeRef.current?.changeType(value)
            }
          />
        </ThemedView>

        <View>
          {orderType === OrderType.IN_PLACE && (
            <OptionRow
              icon="layout-grid"
              label={t("common:labels.table")}
              value={table?.name}
              placeholder={t("common:actions.select")}
              onPress={() => typeChangeRef.current?.changeTable()}
            />
          )}
          <OptionRow
            icon="users"
            label={t("orders:form.people")}
            value={String(people)}
            onPress={() => peopleSheetRef.current?.present()}
          />
        </View>

        <ThemedView style={tw`pt-4`}>
          <DeliveryTimeOptions
            value={deliveryTime}
            onStandard={() => setDeliveryTime(null)}
            onSchedule={() => deliveryTimeSheetRef.current?.present()}
          />
        </ThemedView>
      </ThemedView>

      <CartTypeChangeSheets ref={typeChangeRef} />
      <PeopleBottomSheet
        ref={peopleSheetRef}
        value={people}
        onDone={setPeople}
      />
      <DeliveryTimeBottomSheet
        ref={deliveryTimeSheetRef}
        value={deliveryTime}
        onChange={setDeliveryTime}
      />
    </>
  );
}

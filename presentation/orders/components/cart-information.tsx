import { useRef } from "react";
import { Pressable, View } from "react-native";
import dayjs from "dayjs";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Chip from "@/presentation/theme/components/chip";
import OptionRow from "@/presentation/theme/components/option-row";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { useNewOrderStore } from "../store/newOrderStore";
import NoteBottomSheet from "./note-bottom-sheet";
import PeopleBottomSheet, {
  type PeopleBottomSheetRef,
} from "./people-bottom-sheet";
import DeliveryTimeBottomSheet, {
  type DeliveryTimeBottomSheetRef,
} from "./delivery-time-bottom-sheet";
import CartTypeChangeSheets, {
  type CartTypeChangeSheetsRef,
} from "./cart-type-change-sheets";

/**
 * The order being built in the cart, edited in place: each row opens a sheet
 * that writes straight to the new-order store, so there's nothing to save.
 */
export default function CartInformation() {
  const { t } = useTranslation(["common", "menu", "orders"]);
  const orderType = useNewOrderStore((state) => state.orderType);
  const table = useNewOrderStore((state) => state.table);
  const people = useNewOrderStore((state) => state.people);
  const setPeople = useNewOrderStore((state) => state.setPeople);
  const notes = useNewOrderStore((state) => state.notes);
  const setNotes = useNewOrderStore((state) => state.setNotes);
  const deliveryTime = useNewOrderStore((state) => state.deliveryTime);
  const setDeliveryTime = useNewOrderStore((state) => state.setDeliveryTime);

  const typePickerRef = useRef<BottomSheetPickerRef>(null);
  // Type and table changes take the same steps as the cart's options sheet.
  const typeChangeRef = useRef<CartTypeChangeSheetsRef>(null);
  const peopleSheetRef = useRef<PeopleBottomSheetRef>(null);
  const deliveryTimeSheetRef = useRef<DeliveryTimeBottomSheetRef>(null);
  const noteSheetRef = useRef<BottomSheetMethods>(null);
  const hasNote = notes.trim() !== "";

  return (
    <>
      <ThemedView style={tw`gap-2`}>
        {/* Same as the product sheet: an "Add note" chip, then the note itself. */}
        {hasNote ? (
          <Pressable
            onPress={() => noteSheetRef.current?.present()}
            accessibilityRole="button"
            accessibilityLabel={`${t("menu:product.editNote")}: ${notes}`}
            hitSlop={8}
            style={({ pressed }) => [tw`py-2`, pressed && tw`opacity-60`]}
          >
            <ThemedText type="body2" numberOfLines={2}>
              {notes}
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedView style={tw`flex-row`}>
            <Chip
              variant="assist"
              label={t("menu:product.addNote")}
              icon="file-text"
              onPress={() => noteSheetRef.current?.present()}
            />
          </ThemedView>
        )}

        <View>
          <OptionRow
            icon={
              orderType === OrderType.IN_PLACE ? "utensils" : "shopping-bag"
            }
            label={t("orders:newOrder.orderType")}
            value={
              orderType === OrderType.IN_PLACE
                ? t("common:orderType.inPlace")
                : t("common:orderType.takeAway")
            }
            onPress={() => typePickerRef.current?.present()}
          />
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
          <OptionRow
            icon="clock"
            label={t("orders:form.deliveryTime")}
            value={
              deliveryTime ? dayjs(deliveryTime).format("HH:mm") : undefined
            }
            placeholder={t("common:actions.add")}
            onPress={() => deliveryTimeSheetRef.current?.present()}
          />
        </View>
      </ThemedView>

      <BottomSheetPicker
        ref={typePickerRef}
        title={t("orders:newOrder.orderType")}
        options={[
          { label: t("common:orderType.inPlace"), value: OrderType.IN_PLACE },
          { label: t("common:orderType.takeAway"), value: OrderType.TAKE_AWAY },
        ]}
        value={orderType}
        onChange={(value) =>
          typeChangeRef.current?.changeType(value as OrderType)
        }
      />
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
      <NoteBottomSheet
        ref={noteSheetRef}
        initialValue={notes}
        onSave={(note) => {
          setNotes(note.trim());
          noteSheetRef.current?.dismiss();
        }}
        placeholder={t("orders:newOrder.notesPlaceholder")}
      />
    </>
  );
}

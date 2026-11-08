import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRouter } from "expo-router";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import TextFieldBottomSheet, {
  type TextFieldBottomSheetRef,
} from "@/presentation/theme/components/text-field-bottom-sheet";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import SplitPersonCard from "@/presentation/orders/components/split-person-card";
import { typography } from "@/constants/theme";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import {
  MAX_SPLIT_PEOPLE,
  MIN_SPLIT_PEOPLE,
  getPersonQty,
  getPersonTotal,
  getSplitDetailName,
  getSplittableDetails,
  getUnassignedQty,
  useSplitBillStore,
} from "@/presentation/orders/store/splitBillStore";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { generateIdempotencyKey } from "@/helpers/idempotency";
import { SplitBillItemDto } from "@/core/orders/dto/split-bills.dto";
import { formatQuantity } from "@/core/orders/utils/bill-split.util";

/**
 * Splits an order into several bills at once: one card per person (or seat)
 * with what's on their bill. "Editar cuenta" opens that person's screen to
 * pick their items; what nobody has stays on the order.
 */
export default function SplitBillScreen() {
  const { t } = useTranslation(["common", "bills", "orders"]);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const order = useOrdersStore((state) => state.activeOrder);
  const { mutate: splitBills, isLoading: isSplitting } = useBills().splitBills;
  const [idempotencyKey] = useState(() => generateIdempotencyKey());

  const draftOrderId = useSplitBillStore((state) => state.orderId);
  const people = useSplitBillStore((state) => state.people);
  const own = useSplitBillStore((state) => state.own);
  const shared = useSplitBillStore((state) => state.shared);
  const peopleEdited = useSplitBillStore((state) => state.peopleEdited);
  const start = useSplitBillStore((state) => state.start);
  const reset = useSplitBillStore((state) => state.reset);
  const addPerson = useSplitBillStore((state) => state.addPerson);
  const removePerson = useSplitBillStore((state) => state.removePerson);
  const renamePerson = useSplitBillStore((state) => state.renamePerson);
  const draft = { own, shared };

  const [showDiscard, setShowDiscard] = useState(false);
  const pendingAction = useRef<any>(null);
  const leavingRef = useRef(false);

  const renameSheetRef = useRef<TextFieldBottomSheetRef>(null);
  const personSheetRef = useRef<BottomSheetMethods>(null);
  const [optionsKey, setOptionsKey] = useState<number | null>(null);

  const defaultLabel = (index: number) =>
    t("bills:split.personDefault", { number: index + 1 });

  // A fresh split each time the screen opens; gone once it closes.
  const orderId = order?.id;
  const orderPeople = order?.people ?? 0;
  useEffect(() => {
    if (!orderId) return;
    const count = Math.min(
      Math.max(orderPeople, MIN_SPLIT_PEOPLE),
      MAX_SPLIT_PEOPLE,
    );
    start(
      orderId,
      Array.from({ length: count }, (_, i) =>
        t("bills:split.personDefault", { number: i + 1 }),
      ),
    );
    return () => reset();
    // Only when the order changes, not on every translation render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const details = useMemo(
    () => getSplittableDetails(order?.details),
    [order?.details],
  );

  const bills: SplitBillItemDto[] = people
    .map((person) => ({
      label: person.label.trim(),
      details: details
        .map((detail) => ({
          orderDetailId: detail.id,
          quantity: getPersonQty(draft, person.key, detail.id),
        }))
        .filter((d) => d.quantity > 0),
    }))
    .filter((bill) => bill.details.length > 0);

  const assignedTotal = people.reduce(
    (acc, p) => acc + getPersonTotal(draft, p.key, details),
    0,
  );
  const unassigned = details
    .map((detail) => ({ detail, quantity: getUnassignedQty(draft, detail) }))
    .filter((line) => line.quantity > 0);

  const isDirty =
    peopleEdited ||
    Object.keys(shared).length > 0 ||
    Object.values(own).some((items) =>
      Object.values(items).some((qty) => qty > 0),
    );

  // Back, swipe or header back: ask before throwing the split away.
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!isDirty || leavingRef.current) return;
      e.preventDefault();
      pendingAction.current = e.data.action;
      setShowDiscard(true);
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  // The draft starts in an effect; skip the first frame without it.
  if (draftOrderId !== order.id) return <ScreenLayout style={tw`flex-1`} />;

  const onCreate = () => {
    if (bills.length === 0) return;
    splitBills(
      { idempotencyKey, orderId: order.id, bills },
      {
        onSuccess: () => {
          leavingRef.current = true;
          router.replace({
            pathname: "/(order)/[id]/bills",
            params: { id: order.id },
          });
        },
      },
    );
  };

  const editPerson = (key: number) =>
    router.push({
      pathname: "/(order)/[id]/bills/split/person",
      params: { id: order.id, person: String(key) },
    });

  const optionsPerson = people.find((p) => p.key === optionsKey);

  const openOptions = (key: number) => {
    setOptionsKey(key);
    personSheetRef.current?.present();
  };

  const rename = async (value: string) => {
    if (optionsKey === null) return;
    const index = people.findIndex((p) => p.key === optionsKey);
    renamePerson(optionsKey, value.trim() || defaultLabel(index));
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pt-6 pb-32`}
      >
        <ThemedView style={tw`mb-4`}>
          <ThemedText type="h2" style={tw`mb-1`}>
            {t("bills:split.title")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("bills:split.subtitle", { number: order.num })}
          </ThemedText>
        </ThemedView>

        {details.length === 0 ? (
          <ThemedText type="body1" style={tw`pt-8 text-gray-500 text-center`}>
            {t("bills:newBill.allItemsBilled")}
          </ThemedText>
        ) : (
          <ThemedView style={tw`gap-3`}>
            {people.map((person) => (
              <SplitPersonCard
                key={person.key}
                name={person.label}
                total={getPersonTotal(draft, person.key, details)}
                lines={details
                  .map((detail) => {
                    const quantity = getPersonQty(draft, person.key, detail.id);
                    return {
                      id: detail.id,
                      name: getSplitDetailName(detail),
                      quantity,
                      amount: quantity * detail.price,
                      shared: !!shared[detail.id]?.people.includes(person.key),
                    };
                  })
                  .filter((line) => line.quantity > 0)}
                onEdit={() => editPerson(person.key)}
                onOptions={() => openOptions(person.key)}
              />
            ))}

            {people.length < MAX_SPLIT_PEOPLE && (
              <Button
                label={t("bills:split.addPersonFull")}
                leftIcon="user-plus"
                variant="outline"
                onPress={() => addPerson(defaultLabel(people.length))}
              />
            )}

            {/* What nobody has yet stays on the order */}
            {unassigned.length > 0 && (
              <Card variant="default" style={tw`p-4 gap-2 mt-3`}>
                <ThemedView style={tw`bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.bold }}
                  >
                    {t("bills:split.unassignedTitle")}
                  </ThemedText>
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("bills:split.unassignedNote")}
                  </ThemedText>
                </ThemedView>
                {unassigned.map(({ detail, quantity }) => (
                  <ThemedView
                    key={detail.id}
                    style={tw`bg-transparent flex-row items-center gap-2`}
                  >
                    <ThemedText
                      type="body2"
                      style={[tw`min-w-6`, { fontFamily: typography.bold }]}
                    >
                      {formatQuantity(quantity)}
                    </ThemedText>
                    <ThemedText
                      type="body2"
                      numberOfLines={1}
                      style={tw`flex-1`}
                    >
                      {getSplitDetailName(detail)}
                    </ThemedText>
                    <ThemedText type="body2" style={tw`text-gray-600`}>
                      {formatCurrency(quantity * detail.price)}
                    </ThemedText>
                  </ThemedView>
                ))}
              </Card>
            )}
          </ThemedView>
        )}
      </ScrollView>

      {/* Fixed bottom bar */}
      <ThemedView
        style={[
          tw`absolute bottom-0 left-0 right-0 bg-background border-t border-divider px-4 pt-3`,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          label={t("bills:split.create", {
            count: bills.length,
            amount: formatCurrency(assignedTotal),
          })}
          onPress={onCreate}
          loading={isSplitting}
          disabled={bills.length === 0 || isSplitting}
        />
      </ThemedView>

      <TextFieldBottomSheet
        ref={renameSheetRef}
        title={t("bills:split.rename")}
        value={optionsPerson?.label ?? ""}
        placeholder={t("bills:split.namePlaceholder")}
        maxLength={40}
        submitLabel={t("common:actions.save")}
        onSubmit={rename}
      />

      {/* One person's options */}
      <ThemedBottomSheetModal ref={personSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={optionsPerson?.label}
          items={[
            {
              icon: "pencil",
              label: t("bills:split.renameAction"),
              onPress: () => {
                personSheetRef.current?.dismiss();
                renameSheetRef.current?.present();
              },
            },
            {
              icon: "user-minus",
              label: t("bills:split.removePerson"),
              color: "text-red-500",
              disabled: people.length <= MIN_SPLIT_PEOPLE,
              hint:
                people.length <= MIN_SPLIT_PEOPLE
                  ? t("bills:split.removePersonBlocked")
                  : t("bills:split.removePersonHint"),
              onPress: () => {
                personSheetRef.current?.dismiss();
                if (optionsKey !== null) removePerson(optionsKey);
              },
            },
          ]}
        />
      </ThemedBottomSheetModal>

      <DialogModal
        visible={showDiscard}
        title={t("bills:split.discardTitle")}
        message={t("bills:split.discardMessage")}
        confirmLabel={t("bills:split.discard")}
        cancelLabel={t("bills:split.keepSplitting")}
        confirmVariant="destructive"
        onConfirm={() => {
          setShowDiscard(false);
          leavingRef.current = true;
          if (pendingAction.current) navigation.dispatch(pendingAction.current);
        }}
        onCancel={() => {
          pendingAction.current = null;
          setShowDiscard(false);
        }}
      />
    </ScreenLayout>
  );
}

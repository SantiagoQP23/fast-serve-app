import { useMemo, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Checkbox from "@/presentation/theme/components/checkbox";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import TextFieldBottomSheet, {
  type TextFieldBottomSheetRef,
} from "@/presentation/theme/components/text-field-bottom-sheet";
import ActionsBottomSheet, {
  type ActionsBottomSheetItem,
} from "@/presentation/theme/components/actions-bottom-sheet";
import SplitItemRow from "@/presentation/orders/components/split-item-row";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import {
  MIN_SPLIT_PEOPLE,
  getPersonTotal,
  getSplitDetailName,
  getSplittableDetails,
  getUnassignedQty,
  useSplitBillStore,
} from "@/presentation/orders/store/splitBillStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { roundQty } from "@/core/orders/utils/bill-split.util";

/**
 * One person's bill in a split: tapping an item gives them one unit,
 * long-press shares it or takes it off. Changes apply as they're made;
 * "Listo" goes back to the split.
 */
export default function SplitPersonScreen() {
  const { t } = useTranslation(["common", "bills", "orders"]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { person: personParam } = useLocalSearchParams<{ person: string }>();
  const personKey = Number(personParam);
  const order = useOrdersStore((state) => state.activeOrder);

  const people = useSplitBillStore((state) => state.people);
  const own = useSplitBillStore((state) => state.own);
  const shared = useSplitBillStore((state) => state.shared);
  const setOwnQty = useSplitBillStore((state) => state.setOwnQty);
  const setShare = useSplitBillStore((state) => state.setShare);
  const unshare = useSplitBillStore((state) => state.unshare);
  const renamePerson = useSplitBillStore((state) => state.renamePerson);
  const draft = { own, shared };

  const renameSheetRef = useRef<TextFieldBottomSheetRef>(null);
  const itemSheetRef = useRef<BottomSheetMethods>(null);
  const shareSheetRef = useRef<BottomSheetMethods>(null);
  const [actionsDetail, setActionsDetail] = useState<OrderDetail | null>(null);
  const [shareDetail, setShareDetail] = useState<OrderDetail | null>(null);
  const [sharePeople, setSharePeople] = useState<number[]>([]);

  const details = useMemo(
    () => getSplittableDetails(order?.details),
    [order?.details],
  );

  const personIndex = people.findIndex((p) => p.key === personKey);
  const person = people[personIndex];

  // Gone from the split (removed, or the split was closed).
  if (!order || !person) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  const mineOf = (detailId: string) => own[personKey]?.[detailId] ?? 0;
  const personName = (key: number) =>
    people.find((p) => p.key === key)?.label ?? "";

  // Whole units, but the last fraction left (after a share) goes in one step.
  const increase = (detail: OrderDetail) => {
    const step = Math.min(1, getUnassignedQty(draft, detail));
    if (step > 0) setOwnQty(personKey, detail.id, mineOf(detail.id) + step);
  };

  const decrease = (detail: OrderDetail) => {
    const current = mineOf(detail.id);
    const fraction = roundQty(current % 1);
    setOwnQty(personKey, detail.id, Math.max(current - (fraction || 1), 0));
  };

  const openItemActions = (detail: OrderDetail) => {
    setActionsDetail(detail);
    itemSheetRef.current?.present();
  };

  // Run an item action once its sheet is out of the way.
  const fromItemSheet = (action: () => void) => {
    itemSheetRef.current?.dismiss();
    action();
  };

  const openShare = (detail: OrderDetail) => {
    setShareDetail(detail);
    setSharePeople(shared[detail.id]?.people ?? people.map((p) => p.key));
    shareSheetRef.current?.present();
  };

  const toggleSharePerson = (key: number, checked: boolean) =>
    setSharePeople((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key),
    );

  const confirmShare = () => {
    if (!shareDetail || sharePeople.length < MIN_SPLIT_PEOPLE) return;
    const units = roundQty(
      getUnassignedQty(draft, shareDetail) +
        (shared[shareDetail.id]?.units ?? 0),
    );
    // Keep the people in the split's order.
    const ordered = people
      .map((p) => p.key)
      .filter((k) => sharePeople.includes(k));
    setShare(shareDetail.id, { units, people: ordered });
    shareSheetRef.current?.dismiss();
  };

  const rename = async (value: string) =>
    renamePerson(
      personKey,
      value.trim() ||
        t("bills:split.personDefault", { number: personIndex + 1 }),
    );

  const total = getPersonTotal(draft, personKey, details);
  const unassignedCount = details.filter(
    (d) => getUnassignedQty(draft, d) > 0,
  ).length;

  const actionsShare = actionsDetail ? shared[actionsDetail.id] : undefined;
  const canShare =
    !!actionsShare ||
    (!!actionsDetail && getUnassignedQty(draft, actionsDetail) > 0);

  const itemActions: ActionsBottomSheetItem[] = actionsDetail
    ? [
        {
          icon: "split",
          label: t(
            actionsShare ? "bills:split.editShare" : "bills:split.share",
          ),
          disabled: !canShare,
          hint: canShare ? undefined : t("bills:split.shareBlocked"),
          onPress: () => fromItemSheet(() => openShare(actionsDetail)),
        },
        ...(mineOf(actionsDetail.id) > 0
          ? [
              {
                icon: "minus" as const,
                label: t("bills:split.removeFrom", { name: person.label }),
                onPress: () =>
                  fromItemSheet(() =>
                    setOwnQty(personKey, actionsDetail.id, 0),
                  ),
              },
            ]
          : []),
        ...(actionsShare
          ? [
              {
                icon: "x" as const,
                label: t("bills:split.unshare"),
                onPress: () => fromItemSheet(() => unshare(actionsDetail.id)),
              },
            ]
          : []),
      ]
    : [];

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pt-6 pb-32`}
      >
        <ThemedView style={tw`mb-4`}>
          <ThemedView style={tw`flex-row items-center gap-1`}>
            <ThemedText type="h2" numberOfLines={1} style={tw`shrink`}>
              {person.label}
            </ThemedText>
            <IconButton
              icon="pencil"
              accessibilityLabel={t("bills:split.renameAction")}
              onPress={() => renameSheetRef.current?.present()}
            />
          </ThemedView>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {unassignedCount > 0
              ? t("bills:split.unassignedItems", { count: unassignedCount })
              : t("bills:split.allItemsAssigned")}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`gap-3`}>
          {details.map((detail) => {
            const mine = mineOf(detail.id);
            const unassigned = getUnassignedQty(draft, detail);
            const share = shared[detail.id];
            const others = people
              .filter((p) => p.key !== personKey)
              .map((p) => ({
                name: p.label,
                quantity: own[p.key]?.[detail.id] ?? 0,
              }))
              .filter((other) => other.quantity > 0);
            return (
              <SplitItemRow
                key={detail.id}
                detail={detail}
                personName={person.label}
                mine={mine}
                unassigned={unassigned}
                others={others}
                share={
                  share && {
                    quantity: share.units,
                    names: share.people.map(personName),
                  }
                }
                onPress={
                  unassigned > 0
                    ? () => increase(detail)
                    : share
                      ? () => openItemActions(detail)
                      : undefined
                }
                onLongPress={() => openItemActions(detail)}
                onDecrease={() => decrease(detail)}
              />
            );
          })}
        </ThemedView>
      </ScrollView>

      {/* Fixed bottom bar */}
      <ThemedView
        style={[
          tw`absolute bottom-0 left-0 right-0 bg-background border-t border-divider px-4 pt-3`,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          label={t("bills:split.done", { amount: formatCurrency(total) })}
          onPress={() => router.back()}
        />
      </ThemedView>

      <TextFieldBottomSheet
        ref={renameSheetRef}
        title={t("bills:split.rename")}
        value={person.label}
        placeholder={t("bills:split.namePlaceholder")}
        maxLength={40}
        submitLabel={t("common:actions.save")}
        onSubmit={rename}
      />

      {/* One item's options: share it, take it off this person */}
      <ThemedBottomSheetModal ref={itemSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={actionsDetail ? getSplitDetailName(actionsDetail) : ""}
          items={itemActions}
        />
      </ThemedBottomSheetModal>

      {/* Who shares this item */}
      <ThemedBottomSheetModal ref={shareSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h3" style={tw`text-center`}>
              {t("bills:split.shareTitle", {
                name: shareDetail ? getSplitDetailName(shareDetail) : "",
              })}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-500 text-center`}>
              {t("bills:split.shareDescription")}
            </ThemedText>
          </ThemedView>
          <ThemedView style={tw`gap-3`}>
            {people.map((p) => (
              <Checkbox
                key={p.key}
                label={p.label}
                value={sharePeople.includes(p.key)}
                onValueChange={(checked) => toggleSharePerson(p.key, checked)}
              />
            ))}
          </ThemedView>
          <Button
            label={t("bills:split.shareConfirm", { count: sharePeople.length })}
            onPress={confirmShare}
            disabled={sharePeople.length < MIN_SPLIT_PEOPLE}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </ScreenLayout>
  );
}

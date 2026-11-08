import { useMemo, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Chip from "@/presentation/theme/components/chip";
import Card from "@/presentation/theme/components/card";
import Checkbox from "@/presentation/theme/components/checkbox";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import TextFieldBottomSheet, {
  type TextFieldBottomSheetRef,
} from "@/presentation/theme/components/text-field-bottom-sheet";
import ModifierLines from "@/presentation/orders/components/modifier-lines";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { generateIdempotencyKey } from "@/helpers/idempotency";
import {
  OrderDetail,
  OrderDetailStatus,
} from "@/core/orders/models/order-detail.model";
import { SplitBillItemDto } from "@/core/orders/dto/split-bills.dto";
import {
  formatQuantity,
  getUnbilledQty,
  roundQty,
  shareQuantity,
} from "@/core/orders/utils/bill-split.util";

const MAX_PEOPLE = 20;
const MIN_PEOPLE = 2;

interface Person {
  key: number;
  label: string;
}

/** Units of one item shared equally between some people. */
interface Share {
  units: number;
  people: number[];
}

/**
 * Splits an order into several bills at once: one per person (or seat), each
 * with its own name. Items go to the selected person with the stepper, or are
 * shared equally between several people.
 */
export default function SplitBillScreen() {
  const { t } = useTranslation(["common", "bills", "orders"]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const order = useOrdersStore((state) => state.activeOrder);
  const { mutate: splitBills, isLoading: isSplitting } = useBills().splitBills;
  const [idempotencyKey] = useState(() => generateIdempotencyKey());

  const defaultLabel = (index: number) =>
    t("bills:split.personDefault", { number: index + 1 });

  const [people, setPeople] = useState<Person[]>(() => {
    const count = Math.min(
      Math.max(order?.people ?? 0, MIN_PEOPLE),
      MAX_PEOPLE,
    );
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      label: defaultLabel(i),
    }));
  });
  const nextKey = useRef(people.length);
  const [selectedKey, setSelectedKey] = useState(people[0]?.key ?? 0);
  // person key -> order detail id -> units for that person alone
  const [own, setOwn] = useState<Record<number, Record<string, number>>>({});
  // order detail id -> units shared equally
  const [shared, setShared] = useState<Record<string, Share>>({});

  const renameSheetRef = useRef<TextFieldBottomSheetRef>(null);
  const shareSheetRef = useRef<BottomSheetMethods>(null);
  const [shareDetail, setShareDetail] = useState<OrderDetail | null>(null);
  const [sharePeople, setSharePeople] = useState<number[]>([]);

  const details = useMemo(
    () =>
      (order?.details ?? []).filter(
        (detail) =>
          detail.status !== OrderDetailStatus.CANCELLED &&
          getUnbilledQty(detail) > 0,
      ),
    [order?.details],
  );

  const ownTotalFor = (detailId: string) =>
    roundQty(
      Object.values(own).reduce(
        (acc, items) => acc + (items[detailId] ?? 0),
        0,
      ),
    );

  const unassignedFor = (detail: OrderDetail) =>
    Math.max(
      roundQty(
        getUnbilledQty(detail) -
          ownTotalFor(detail.id) -
          (shared[detail.id]?.units ?? 0),
      ),
      0,
    );

  /** What each person gets of an item: own units plus their share. */
  const quantityFor = (personKey: number, detailId: string) => {
    const mine = own[personKey]?.[detailId] ?? 0;
    const share = shared[detailId];
    if (!share) return mine;
    const index = share.people.indexOf(personKey);
    if (index === -1) return mine;
    return roundQty(
      mine + shareQuantity(share.units, share.people.length)[index],
    );
  };

  const totalFor = (personKey: number) =>
    details.reduce(
      (acc, detail) => acc + quantityFor(personKey, detail.id) * detail.price,
      0,
    );

  const selected = people.find((p) => p.key === selectedKey) ?? people[0];

  const setOwnQty = (detailId: string, value: number) => {
    setOwn((prev) => ({
      ...prev,
      [selectedKey]: { ...prev[selectedKey], [detailId]: roundQty(value) },
    }));
  };

  // Whole units, but the last fraction left (after a share) goes in one step.
  const increase = (detail: OrderDetail) => {
    const current = own[selectedKey]?.[detail.id] ?? 0;
    const step = Math.min(1, unassignedFor(detail));
    if (step > 0) setOwnQty(detail.id, current + step);
  };

  const decrease = (detail: OrderDetail) => {
    const current = own[selectedKey]?.[detail.id] ?? 0;
    const fraction = roundQty(current % 1);
    setOwnQty(detail.id, Math.max(current - (fraction || 1), 0));
  };

  const addPerson = () => {
    if (people.length >= MAX_PEOPLE) return;
    const key = nextKey.current++;
    setPeople((prev) => [...prev, { key, label: defaultLabel(prev.length) }]);
    setSelectedKey(key);
  };

  const removeSelected = () => {
    if (people.length <= MIN_PEOPLE) return;
    const key = selectedKey;
    const remaining = people.filter((p) => p.key !== key);
    setPeople(remaining);
    setOwn(({ [key]: _removed, ...rest }) => rest);
    // A share needs two people; with fewer its units go back to unassigned.
    setShared((prev) =>
      Object.fromEntries(
        Object.entries(prev)
          .map(
            ([id, share]) =>
              [
                id,
                { ...share, people: share.people.filter((p) => p !== key) },
              ] as const,
          )
          .filter(([, share]) => share.people.length >= MIN_PEOPLE),
      ),
    );
    setSelectedKey(remaining[0].key);
  };

  const rename = async (value: string) => {
    setPeople((prev) =>
      prev.map((p, i) =>
        p.key === selectedKey ? { ...p, label: value || defaultLabel(i) } : p,
      ),
    );
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
    if (!shareDetail || sharePeople.length < MIN_PEOPLE) return;
    const units = roundQty(
      unassignedFor(shareDetail) + (shared[shareDetail.id]?.units ?? 0),
    );
    // Keep the people in the order of the chips.
    const ordered = people
      .map((p) => p.key)
      .filter((k) => sharePeople.includes(k));
    setShared((prev) => ({
      ...prev,
      [shareDetail.id]: { units, people: ordered },
    }));
    shareSheetRef.current?.dismiss();
  };

  const unshare = (detailId: string) =>
    setShared(({ [detailId]: _removed, ...rest }) => rest);

  const bills: SplitBillItemDto[] = people
    .map((person) => ({
      label: person.label.trim(),
      details: details
        .map((detail) => ({
          orderDetailId: detail.id,
          quantity: quantityFor(person.key, detail.id),
        }))
        .filter((d) => d.quantity > 0),
    }))
    .filter((bill) => bill.details.length > 0);

  const unassignedCount = details.filter((d) => unassignedFor(d) > 0).length;
  const assignedTotal = people.reduce((acc, p) => acc + totalFor(p.key), 0);

  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  const onCreate = () => {
    if (bills.length === 0) return;
    splitBills(
      { idempotencyKey, orderId: order.id, bills },
      {
        onSuccess: () => {
          router.replace({
            pathname: "/(order)/[id]/bills",
            params: { id: order.id },
          });
        },
      },
    );
  };

  const personName = (key: number) =>
    people.find((p) => p.key === key)?.label ?? "";

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pt-6 pb-40`}
      >
        <ThemedView style={tw`px-4 mb-4`}>
          <ThemedText type="h2" style={tw`mb-1`}>
            {t("bills:split.title")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("bills:split.subtitle", { number: order.num })}
          </ThemedText>
        </ThemedView>

        {/* People: tap to pick who gets the items below */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`px-4 gap-2`}
        >
          {people.map((person) => (
            <Chip
              key={person.key}
              label={`${person.label} · ${formatCurrency(totalFor(person.key))}`}
              selected={person.key === selectedKey}
              showSelectedCheck={false}
              onPress={() =>
                person.key === selectedKey
                  ? renameSheetRef.current?.present()
                  : setSelectedKey(person.key)
              }
              onLongPress={() => {
                setSelectedKey(person.key);
                renameSheetRef.current?.present();
              }}
              accessibilityHint={t("bills:split.renameHint")}
            />
          ))}
          {people.length < MAX_PEOPLE && (
            <Chip
              variant="assist"
              icon="user-plus"
              label={t("bills:split.addPerson")}
              onPress={addPerson}
            />
          )}
        </ScrollView>

        {selected && (
          <ThemedView
            style={tw`mx-4 mt-3 mb-4 flex-row items-center justify-between`}
          >
            <ThemedText type="body2" style={tw`text-gray-500 flex-1`}>
              {t("bills:split.assigningTo", { name: selected.label })}
            </ThemedText>
            <IconButton
              icon="pencil"
              accessibilityLabel={t("bills:split.rename")}
              onPress={() => renameSheetRef.current?.present()}
            />
            {people.length > MIN_PEOPLE && (
              <IconButton
                icon="trash"
                accessibilityLabel={t("bills:split.removePerson")}
                onPress={removeSelected}
              />
            )}
          </ThemedView>
        )}

        {details.length === 0 ? (
          <ThemedText
            type="body1"
            style={tw`px-4 pt-8 text-gray-500 text-center`}
          >
            {t("bills:newBill.allItemsBilled")}
          </ThemedText>
        ) : (
          <ThemedView style={tw`px-4 gap-3`}>
            {details.map((detail) => {
              const mine = own[selectedKey]?.[detail.id] ?? 0;
              const unassigned = unassignedFor(detail);
              const share = shared[detail.id];
              const showOption =
                detail.product.options.length > 1 && detail.productOption;
              return (
                <Card
                  key={detail.id}
                  variant="outline"
                  style={tw.style("p-4 gap-3", mine > 0 && "bg-secondary")}
                >
                  <ThemedView
                    style={tw`flex-row items-center gap-3 bg-transparent`}
                  >
                    <ThemedView style={tw`flex-1 bg-transparent`}>
                      <ThemedText type="body1" style={tw`font-semibold`}>
                        {detail.product.name}
                        {showOption ? ` ${detail.productOption?.name}` : ""}
                      </ThemedText>
                      <ModifierLines modifiers={detail.modifiers} />
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {formatCurrency(detail.price)}
                        {" · "}
                        {unassigned > 0
                          ? t("bills:split.unassigned", {
                              quantity: formatQuantity(unassigned),
                            })
                          : t("bills:split.allAssigned")}
                      </ThemedText>
                    </ThemedView>
                    <IconButton
                      icon="minus"
                      variant="outlined"
                      onPress={() => decrease(detail)}
                      disabled={mine === 0}
                      accessibilityLabel={t("common:actions.decrease")}
                    />
                    <ThemedText
                      type="h4"
                      style={tw`min-w-8 text-center`}
                      accessibilityLiveRegion="polite"
                    >
                      {formatQuantity(mine)}
                    </ThemedText>
                    <IconButton
                      icon="plus"
                      variant="outlined"
                      onPress={() => increase(detail)}
                      disabled={unassigned === 0}
                      accessibilityLabel={t("common:actions.increase")}
                    />
                  </ThemedView>

                  {share ? (
                    <ThemedView
                      style={tw`flex-row items-center gap-2 bg-transparent`}
                    >
                      <ThemedText type="body2" style={tw`flex-1`}>
                        {t("bills:split.sharedBetween", {
                          quantity: formatQuantity(share.units),
                          names: share.people.map(personName).join(", "),
                        })}
                      </ThemedText>
                      <Button
                        label={t("common:actions.edit")}
                        variant="text"
                        size="small"
                        onPress={() => openShare(detail)}
                      />
                      <IconButton
                        icon="x"
                        accessibilityLabel={t("bills:split.unshare")}
                        onPress={() => unshare(detail.id)}
                      />
                    </ThemedView>
                  ) : (
                    unassigned > 0 && (
                      <Button
                        label={t("bills:split.share")}
                        leftIcon="split"
                        variant="surface"
                        shape="rounded"
                        size="small"
                        style={tw`self-start`}
                        onPress={() => openShare(detail)}
                      />
                    )
                  )}
                </Card>
              );
            })}
          </ThemedView>
        )}
      </ScrollView>

      {/* Fixed bottom bar */}
      <ThemedView
        style={[
          tw`absolute bottom-0 left-0 right-0 bg-background border-t border-divider px-4 pt-3 gap-2`,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {unassignedCount > 0 && (
          <ThemedText type="small" style={tw`text-gray-500 text-center`}>
            {t("bills:split.unassignedItems", { count: unassignedCount })}
          </ThemedText>
        )}
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
        value={selected?.label ?? ""}
        placeholder={t("bills:split.namePlaceholder")}
        maxLength={40}
        submitLabel={t("common:actions.save")}
        onSubmit={rename}
      />

      {/* Who shares this item */}
      <ThemedBottomSheetModal ref={shareSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h3" style={tw`text-center`}>
              {t("bills:split.shareTitle", {
                name: shareDetail?.product.name ?? "",
              })}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-500 text-center`}>
              {t("bills:split.shareDescription")}
            </ThemedText>
          </ThemedView>
          <ThemedView style={tw`gap-3`}>
            {people.map((person) => (
              <Checkbox
                key={person.key}
                label={person.label}
                value={sharePeople.includes(person.key)}
                onValueChange={(checked) =>
                  toggleSharePerson(person.key, checked)
                }
              />
            ))}
          </ThemedView>
          <Button
            label={t("bills:split.shareConfirm", { count: sharePeople.length })}
            onPress={confirmShare}
            disabled={sharePeople.length < MIN_PEOPLE}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </ScreenLayout>
  );
}

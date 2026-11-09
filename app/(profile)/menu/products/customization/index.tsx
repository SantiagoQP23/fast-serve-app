import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable } from "react-native";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import {
  NestedReorderableList,
  ScrollViewContainer,
  reorderItems,
  useReorderableDrag,
} from "react-native-reorderable-list";
import { toast } from "sonner-native";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import DetailHeader from "@/presentation/theme/components/detail-header";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import IconButton from "@/presentation/theme/components/icon-button";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { parseAmount } from "@/presentation/menu-management/components/modifier-option-sheet";
import ProductComponentSheet, {
  type ProductComponentDraft,
  type ProductComponentSheetRef,
} from "@/presentation/menu-management/components/product-component-sheet";
import GroupLimitsSheet, {
  describeLimits,
  type GroupLimitsSheetRef,
} from "@/presentation/menu-management/components/group-limits-sheet";
import { useModifierGroups } from "@/presentation/menu-management/hooks/useModifierGroups";
import { useGroupLinkHandoff } from "@/presentation/menu-management/store/useGroupLinkHandoff";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import {
  getProductComponents,
  hasVariantRules,
  type ModifierGroup,
  type VariantGroupRule,
} from "@/core/menu/models/customization.model";
import { getProductActiveOptions } from "@/core/menu/models/product.model";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

interface GroupLinkDraft {
  groupId: string;
  minSelect: number | null;
  maxSelect: number | null;
  variants: VariantGroupRule[];
}

/** Compares drafts by content; component keys are only for React. */
const snapshot = (
  components: ProductComponentDraft[],
  links: GroupLinkDraft[],
) =>
  JSON.stringify({
    components: components.map(({ key, ...component }) => component),
    links,
  });

/** Spreads a long-press drag and screen-reader move actions over a row. */
function useRowMove(
  isFirst: boolean,
  isLast: boolean,
  onMove: (delta: number) => void,
) {
  const { t } = useTranslation("menuManagement");
  const drag = useReorderableDrag();
  return {
    onLongPress: drag,
    delayLongPress: 200,
    accessibilityActions: [
      ...(isFirst ? [] : [{ name: "moveUp", label: t("modifierGroups.moveUp") }]),
      ...(isLast
        ? []
        : [{ name: "moveDown", label: t("modifierGroups.moveDown") }]),
    ],
    onAccessibilityAction: (event: { nativeEvent: { actionName: string } }) =>
      onMove(event.nativeEvent.actionName === "moveUp" ? -1 : 1),
  };
}

/** One included item, tapped to edit and long-pressed to move. */
function ComponentRow({
  component,
  item,
  isFirst,
  isLast,
  onPress,
  onMove,
}: {
  component: ProductComponentDraft;
  item?: InventoryItem;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
  onMove: (delta: number) => void;
}) {
  const { t } = useTranslation("menuManagement");
  const moveProps = useRowMove(isFirst, isLast, onMove);
  const discount = parseAmount(component.discount);

  const details = [
    component.removable
      ? t("customization.fields.removable")
      : t("customization.alwaysIncluded"),
    component.removable && discount > 0 && `−${formatCurrency(discount)}`,
    item && `${item.name} · ${component.inventoryQuantity} ${item.unit}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={onPress}
      {...moveProps}
      accessibilityRole="button"
      accessibilityLabel={`${component.name}, ${details}`}
      style={({ pressed }) =>
        tw.style(
          "flex-row items-center gap-3 py-3 min-h-16",
          !isLast && "border-b border-divider",
          pressed && "opacity-70",
        )
      }
    >
      <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
        <ThemedText style={{ fontFamily: typography.medium }} numberOfLines={2}>
          {component.name}
        </ThemedText>
        <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={2}>
          {details}
        </ThemedText>
      </ThemedView>
      <Icon name="grip-vertical" size={20} color={tw.color("gray-400")} />
    </Pressable>
  );
}

/** One linked group: tapped to edit the group, long-pressed to move. */
function GroupRow({
  link,
  group,
  fallbackName,
  isFirst,
  isLast,
  onPress,
  onMove,
  onUnlink,
  onEditLimits,
}: {
  link: GroupLinkDraft;
  group?: ModifierGroup;
  fallbackName: string;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
  onMove: (delta: number) => void;
  onUnlink: () => void;
  onEditLimits: () => void;
}) {
  const { t } = useTranslation("menuManagement");
  const moveProps = useRowMove(isFirst, isLast, onMove);
  const name = group?.name ?? fallbackName;

  // The product may narrow the group's own rule; the order screen does the same.
  const min = link.minSelect ?? group?.minSelect ?? 0;
  const max = link.maxSelect ?? group?.maxSelect ?? null;
  const hasOwnLimits = link.minSelect !== null || link.maxSelect !== null;
  const details = group
    ? [
        describeLimits(t, min, max),
        hasOwnLimits && t("customization.limits.ownTag"),
        hasVariantRules(link) && t("customization.limits.variesByVariant"),
        !group.isActive && t("modifierGroups.inactive"),
        group.modifiers.map((option) => option.name).join(", "),
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <ThemedView
      style={tw.style(
        "flex-row items-center gap-1 bg-transparent",
        !isLast && "border-b border-divider",
      )}
    >
      <Pressable
        onPress={onPress}
        {...moveProps}
        accessibilityRole="button"
        accessibilityLabel={details ? `${name}, ${details}` : name}
        style={({ pressed }) =>
          tw.style(
            "flex-1 gap-0.5 py-3 min-h-16 justify-center",
            group && !group.isActive && "opacity-50",
            pressed && "opacity-70",
          )
        }
      >
        <ThemedText style={{ fontFamily: typography.medium }} numberOfLines={1}>
          {name}
        </ThemedText>
        {!!details && (
          <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={2}>
            {details}
          </ThemedText>
        )}
      </Pressable>
      {group && (
        <IconButton
          icon="sliders-horizontal"
          size={20}
          onPress={onEditLimits}
          accessibilityLabel={`${t("customization.limits.title")}: ${name}`}
        />
      )}
      <IconButton
        icon="x"
        size={20}
        onPress={onUnlink}
        accessibilityLabel={`${t("customization.unlinkGroup")}: ${name}`}
      />
    </ThemedView>
  );
}

/** An empty section: what goes in it, and the button that adds the first. */
function SectionEmpty({
  message,
  label,
  onPress,
}: {
  message: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <ThemedView style={tw`items-center gap-3 py-4 bg-transparent`}>
      <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
        {message}
      </ThemedText>
      <Button
        label={label}
        leftIcon="plus"
        variant="outline"
        size="small"
        onPress={onPress}
      />
    </ThemedView>
  );
}

/** A section's add button beside its title, once it has something in it. */
function SectionAddButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { t } = useTranslation("common");
  return (
    <Button
      label={t("actions.add")}
      accessibilityLabel={label}
      leftIcon="plus"
      variant="outline"
      size="extra-small"
      onPress={onPress}
    />
  );
}

/**
 * A product's "Personalización": the items it includes (which the waiter
 * may take off, maybe for less) and the shared groups of options it offers,
 * in the order the order screen shows them.
 */
export default function ProductCustomizationScreen() {
  const { t } = useTranslation(["menuManagement", "common"]);
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const navigation = useNavigation();
  const product = useMenuStore((state) =>
    state.products.find((item) => item.id === productId),
  );
  const { groups, saveProductCustomization } = useModifierGroups();
  const { items } = useInventoryItems();

  const [components, setComponents] = useState<ProductComponentDraft[]>(() =>
    getProductComponents(product).map((component) => ({
      key: component.id,
      id: component.id,
      name: component.name,
      removable: component.removable,
      discount: Number(component.removalPriceDelta)
        ? String(Math.abs(Number(component.removalPriceDelta)))
        : "",
      inventoryItemId: component.inventoryItemId,
      inventoryQuantity:
        component.inventoryQuantity !== null
          ? String(component.inventoryQuantity)
          : "",
    })),
  );
  const [links, setLinks] = useState<GroupLinkDraft[]>(() =>
    [...(product?.modifierGroups ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((link) => ({
        groupId: link.groupId,
        minSelect: link.minSelect,
        maxSelect: link.maxSelect,
        variants: [...(link.variants ?? [])].sort(
          (a, b) => a.productOptionId - b.productOptionId,
        ),
      })),
  );
  const componentSheetRef = useRef<ProductComponentSheetRef>(null);
  const groupPickerRef = useRef<BottomSheetPickerRef>(null);
  const limitsSheetRef = useRef<GroupLimitsSheetRef>(null);
  // The limits sheet lists these for per-variant rules.
  const sheetVariants = product
    ? getProductActiveOptions(product).map((option) => ({
        id: option.id,
        name: option.name,
      }))
    : [];

  // What the screen opened with, to know whether leaving loses anything.
  const [initial] = useState(() => snapshot(components, links));
  const isDirty = snapshot(components, links) !== initial;

  // Leaving with unsaved edits asks first. Saving leaves freely.
  const [showDiscard, setShowDiscard] = useState(false);
  const pendingAction = useRef<any>(null);
  const leavingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!isDirty || leavingRef.current) return;
      e.preventDefault();
      pendingAction.current = e.data.action;
      setShowDiscard(true);
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  // A group created from the picker's "Nuevo grupo" comes back linked.
  const takeCreatedGroup = useGroupLinkHandoff((state) => state.take);
  useFocusEffect(
    useCallback(() => {
      const createdId = takeCreatedGroup();
      if (!createdId) return;
      setLinks((current) =>
        current.some((link) => link.groupId === createdId)
          ? current
          : [
              ...current,
              { groupId: createdId, minSelect: null, maxSelect: null, variants: [] },
            ],
      );
    }, [takeCreatedGroup]),
  );

  const groupById = useMemo(
    () => new Map(groups.map((group) => [group.id, group])),
    [groups],
  );
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const linkedGroupName = (groupId: string) =>
    product?.modifierGroups?.find((link) => link.groupId === groupId)?.group
      ?.name ?? "";

  const moveWithin = <T,>(list: T[], index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return list;
    return reorderItems(list, index, target);
  };

  /** Takes an entry out of a list, offering to put it back where it was. */
  const removeWithUndo = <T,>(
    list: T[],
    setList: (update: (current: T[]) => T[]) => void,
    index: number,
    name: string,
  ) => {
    if (index === -1) return;
    const removed = list[index];
    setList((current) => current.filter((entry) => entry !== removed));

    let undone = false;
    const toastId = toast(t("modifierGroups.optionRemoved", { name }), {
      duration: 8000,
      action: {
        label: t("common:actions.undo"),
        onClick: () => {
          if (undone) return;
          undone = true;
          toast.dismiss(toastId);
          setList((current) => {
            const next = [...current];
            next.splice(Math.min(index, next.length), 0, removed);
            return next;
          });
        },
      },
    });
  };

  const handleComponentSubmit = (component: ProductComponentDraft) =>
    setComponents((current) =>
      current.some((entry) => entry.key === component.key)
        ? current.map((entry) =>
            entry.key === component.key ? component : entry,
          )
        : [...current, component],
    );

  const handleSave = async () => {
    if (!product) return;
    try {
      await saveProductCustomization.mutateAsync({
        productId: product.id,
        input: {
          components: components.map((entry) => ({
            ...(entry.id && { id: entry.id }),
            name: entry.name,
            removable: entry.removable,
            removalPriceDelta:
              entry.removable && entry.discount !== ""
                ? -Math.abs(parseAmount(entry.discount))
                : 0,
            inventoryItemId: entry.inventoryItemId,
            inventoryQuantity: entry.inventoryItemId
              ? parseAmount(entry.inventoryQuantity)
              : null,
          })),
          groups: links,
        },
      });
      leavingRef.current = true;
      router.back();
    } catch {
      // The mutation already shows the error; the edits stay on screen.
    }
  };

  if (!product) {
    return (
      <ScreenLayout style={tw`flex-1 items-center justify-center px-8 gap-4`}>
        <Button
          label={t("common:actions.goBack")}
          variant="outline"
          onPress={() => router.back()}
        />
      </ScreenLayout>
    );
  }

  const availableGroups = groups.filter(
    (group) => !links.some((link) => link.groupId === group.id),
  );

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ScreenLayout style={tw`flex-1 px-4 pt-8 bg-background`}>
        <ThemedView style={tw`items-center flex-row mb-6`}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("common:actions.goBack")}
            hitSlop={12}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
          </Pressable>
        </ThemedView>

        <ScrollViewContainer
          contentContainerStyle={tw`gap-4 pb-8`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <DetailHeader
            title={t("customization.title")}
            subtitle={product.name}
            icon="sliders-horizontal"
          >
            <ThemedView style={tw`flex-row flex-wrap gap-3`}>
              <Button
                label={t("customization.manageGroups")}
                leftIcon="list-checks"
                variant="surface"
                shape="rounded"
                size="small"
                onPress={() => router.push("/(profile)/menu/modifier-groups")}
              />
            </ThemedView>
          </DetailHeader>

          {/* Included items */}
          <ThemedView style={tw`gap-3 mt-4`}>
            <DetailSectionTitle
              title={t("customization.includes")}
              action={
                components.length > 0 && (
                  <SectionAddButton
                    label={t("customization.addItem")}
                    onPress={() => componentSheetRef.current?.present()}
                  />
                )
              }
            />
            <DetailCard style={tw`py-2`}>
              {components.length === 0 ? (
                <SectionEmpty
                  message={t("customization.includesHint")}
                  label={t("customization.addItem")}
                  onPress={() => componentSheetRef.current?.present()}
                />
              ) : (
                <NestedReorderableList
                  data={components}
                  keyExtractor={(component) => component.key}
                  scrollEnabled={false}
                  onReorder={({ from, to }) =>
                    setComponents((current) => reorderItems(current, from, to))
                  }
                  renderItem={({ item: component, index }) => (
                    <ComponentRow
                      component={component}
                      item={
                        component.inventoryItemId
                          ? itemById.get(component.inventoryItemId)
                          : undefined
                      }
                      isFirst={index === 0}
                      isLast={index === components.length - 1}
                      onPress={() =>
                        componentSheetRef.current?.present(component)
                      }
                      onMove={(delta) =>
                        setComponents((current) =>
                          moveWithin(current, index, delta),
                        )
                      }
                    />
                  )}
                />
              )}
            </DetailCard>
            {components.length > 1 && (
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("customization.reorderHint")}
              </ThemedText>
            )}
          </ThemedView>

          {/* Linked groups */}
          <ThemedView style={tw`gap-3 mt-4`}>
            <DetailSectionTitle
              title={t("customization.groups")}
              action={
                links.length > 0 && (
                  <SectionAddButton
                    label={t("customization.linkGroup")}
                    onPress={() => groupPickerRef.current?.present()}
                  />
                )
              }
            />
            <DetailCard style={tw.style("py-2", links.length > 0 && "pr-2")}>
              {links.length === 0 ? (
                <SectionEmpty
                  message={t("customization.groupsEmpty")}
                  label={t("customization.linkGroup")}
                  onPress={() => groupPickerRef.current?.present()}
                />
              ) : (
                <NestedReorderableList
                  data={links}
                  keyExtractor={(link) => link.groupId}
                  scrollEnabled={false}
                  onReorder={({ from, to }) =>
                    setLinks((current) => reorderItems(current, from, to))
                  }
                  renderItem={({ item: link, index }) => (
                    <GroupRow
                      link={link}
                      group={groupById.get(link.groupId)}
                      fallbackName={linkedGroupName(link.groupId)}
                      isFirst={index === 0}
                      isLast={index === links.length - 1}
                      onPress={() =>
                        router.push({
                          pathname: "/(profile)/menu/modifier-groups/form",
                          params: { groupId: link.groupId },
                        })
                      }
                      onMove={(delta) =>
                        setLinks((current) => moveWithin(current, index, delta))
                      }
                      onEditLimits={() => {
                        const group = groupById.get(link.groupId);
                        if (group)
                          limitsSheetRef.current?.present(
                            group,
                            link,
                            sheetVariants,
                          );
                      }}
                      onUnlink={() =>
                        removeWithUndo(
                          links,
                          setLinks,
                          index,
                          groupById.get(link.groupId)?.name ??
                            linkedGroupName(link.groupId),
                        )
                      }
                    />
                  )}
                />
              )}
            </DetailCard>
            {links.length > 1 && (
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("customization.groupsReorderHint")}
              </ThemedText>
            )}
          </ThemedView>
        </ScrollViewContainer>

        <ThemedView style={tw`pt-2 pb-4`}>
          <Button
            label={t("customization.save")}
            onPress={handleSave}
            loading={saveProductCustomization.isPending}
            disabled={saveProductCustomization.isPending}
          />
        </ThemedView>
        <ProductComponentSheet
          ref={componentSheetRef}
          items={items}
          onSubmit={handleComponentSubmit}
          onRemove={(component) =>
            removeWithUndo(
              components,
              setComponents,
              components.findIndex((entry) => entry.key === component.key),
              component.name,
            )
          }
        />

        <GroupLimitsSheet
          ref={limitsSheetRef}
          onSubmit={(groupId, limits) =>
            setLinks((current) =>
              current.map((link) =>
                link.groupId === groupId
                  ? {
                      ...link,
                      ...limits,
                      variants: [...limits.variants].sort(
                        (a, b) => a.productOptionId - b.productOptionId,
                      ),
                    }
                  : link,
              ),
            )
          }
        />

        <BottomSheetPicker
          ref={groupPickerRef}
          title={t("customization.linkGroup")}
          searchable
          options={availableGroups.map((group) => ({
            label: group.name,
            value: group.id,
            description: group.modifiers
              .map((option) => option.name)
              .join(", "),
          }))}
          onChange={(value) =>
            setLinks((current) => [
              ...current,
              { groupId: String(value), minSelect: null, maxSelect: null, variants: [] },
            ])
          }
          headerAction={{
            label: t("modifierGroups.newGroup"),
            onPress: () => {
              groupPickerRef.current?.dismiss();
              router.push({
                pathname: "/(profile)/menu/modifier-groups/form",
                params: { linkToProduct: "1" },
              });
            },
          }}
        />

        <DialogModal
          visible={showDiscard}
          title={t("modifierGroups.discardTitle")}
          message={t("customization.discardMessage")}
          confirmLabel={t("modifierGroups.discard")}
          cancelLabel={t("modifierGroups.keepEditing")}
          confirmVariant="destructive"
          onConfirm={() => {
            setShowDiscard(false);
            if (pendingAction.current)
              navigation.dispatch(pendingAction.current);
          }}
          onCancel={() => {
            pendingAction.current = null;
            setShowDiscard(false);
          }}
        />
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}

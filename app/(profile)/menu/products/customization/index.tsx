import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import DetailHeader from "@/presentation/theme/components/detail-header";
import IconButton from "@/presentation/theme/components/icon-button";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import ProductRecipeRow from "@/presentation/menu-management/components/product-recipe-row";
import GroupLimitsSheet, {
  describeDefaults,
  describeLimits,
  type GroupLimitsSheetRef,
} from "@/presentation/menu-management/components/group-limits-sheet";
import { useModifierGroups } from "@/presentation/menu-management/hooks/useModifierGroups";
import { useGroupLinkHandoff } from "@/presentation/menu-management/store/useGroupLinkHandoff";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import {
  hasVariantRules,
  type ModifierGroup,
  type VariantGroupRule,
} from "@/core/menu/models/customization.model";
import {
  getProductActiveOptions,
  type Product,
} from "@/core/menu/models/product.model";

interface GroupLinkDraft {
  groupId: string;
  minSelect: number | null;
  maxSelect: number | null;
  variants: VariantGroupRule[];
  /** Own defaults (plans/predeterminada-por-producto.md); null: the group's. */
  defaultModifierIds: string[] | null;
}

/**
 * Own defaults without options deleted since, so the server (which checks
 * they belong to the group) takes them back.
 */
const existingDefaults = (
  ids: string[] | null | undefined,
  optionIds: Set<string>,
): string[] | null =>
  Array.isArray(ids) ? ids.filter((id) => optionIds.has(id)) : null;

/** The product's saved links, in the order the order screen shows them. */
const linksFromProduct = (product?: Product): GroupLinkDraft[] =>
  [...(product?.modifierGroups ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((link) => {
      const optionIds = new Set(
        (link.group?.modifiers ?? []).map((option) => option.id),
      );
      return {
        groupId: link.groupId,
        minSelect: link.minSelect,
        maxSelect: link.maxSelect,
        defaultModifierIds: existingDefaults(
          link.defaultModifierIds,
          optionIds,
        ),
        variants: [...(link.variants ?? [])]
          .map((rule) => ({
            ...rule,
            defaultModifierIds: existingDefaults(
              rule.defaultModifierIds,
              optionIds,
            ),
          }))
          .sort((a, b) => a.productOptionId - b.productOptionId),
      };
    });

/** Compares drafts by content. */
const snapshot = (links: GroupLinkDraft[]) => JSON.stringify({ links });

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
      ...(isFirst
        ? []
        : [{ name: "moveUp", label: t("modifierGroups.moveUp") }]),
      ...(isLast
        ? []
        : [{ name: "moveDown", label: t("modifierGroups.moveDown") }]),
    ],
    onAccessibilityAction: (event: { nativeEvent: { actionName: string } }) =>
      onMove(event.nativeEvent.actionName === "moveUp" ? -1 : 1),
  };
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
  // What comes picked, when this product (not the group) decides it.
  const comes =
    group && Array.isArray(link.defaultModifierIds)
      ? t("customization.defaults.comes", {
          names: describeDefaults(t, group, link.defaultModifierIds),
        })
      : null;
  const details = group
    ? [
        describeLimits(t, min, max),
        hasOwnLimits && t("customization.limits.ownTag"),
        comes,
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
 * A product's "Personalización": the shared groups of options it offers, in
 * the order the order screen shows them, and a way into its recipe, where
 * what the customer can take off now lives
 * (plans/unificar-receta-incluidos.md).
 */
export default function ProductCustomizationScreen() {
  const { t } = useTranslation(["menuManagement", "common"]);
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const product = useMenuStore((state) =>
    state.products.find((item) => item.id === productId),
  );
  const { groups, saveProductCustomization } = useModifierGroups();

  const [links, setLinks] = useState<GroupLinkDraft[]>(() =>
    linksFromProduct(product),
  );
  const groupPickerRef = useRef<BottomSheetPickerRef>(null);
  const limitsSheetRef = useRef<GroupLimitsSheetRef>(null);
  // The limits sheet lists these for per-variant rules.
  const sheetVariants = product
    ? getProductActiveOptions(product).map((option) => ({
        id: option.id,
        name: option.name,
      }))
    : [];

  // The links as last saved, to tell edits made here from ones made elsewhere.
  const [initialLinks, setInitialLinks] = useState(links);

  // Groups linked or unlinked elsewhere meanwhile (e.g. from a group's
  // screen) reach the draft, so saving here doesn't undo them. Untouched
  // links simply follow; the owner's own adds and removals stay.
  const savedLinks = linksFromProduct(product);
  const savedIds = savedLinks.map((link) => link.groupId);
  const initialIds = initialLinks.map((link) => link.groupId);
  if (
    product &&
    [...savedIds].sort().join() !== [...initialIds].sort().join()
  ) {
    const linksUntouched =
      JSON.stringify(links) === JSON.stringify(initialLinks);
    setLinks((current) =>
      linksUntouched
        ? savedLinks
        : [
            ...current.filter(
              (link) =>
                savedIds.includes(link.groupId) ||
                !initialIds.includes(link.groupId),
            ),
            ...savedLinks.filter(
              (link) =>
                !initialIds.includes(link.groupId) &&
                !current.some((entry) => entry.groupId === link.groupId),
            ),
          ],
    );
    setInitialLinks(savedLinks);
  }

  // Every edit saves on its own, one save at a time; edits made while one
  // is on its way go out right after it. A draft that failed to save waits
  // for the next edit instead of retrying in a loop.
  const draft = snapshot(links);
  const [savedDraft, setSavedDraft] = useState(draft);
  const [failedDraft, setFailedDraft] = useState<string | null>(null);
  const savingRef = useRef(false);
  const { mutateAsync: saveCustomization } = saveProductCustomization;

  useEffect(() => {
    if (!productId || savingRef.current) return;
    if (draft === savedDraft || draft === failedDraft) return;

    savingRef.current = true;
    saveCustomization({
      productId,
      input: { groups: links },
    })
      .then(() => {
        savingRef.current = false;
        setInitialLinks(links);
        setSavedDraft(snapshot(links));
      })
      .catch(() => {
        // The mutation already shows the error.
        savingRef.current = false;
        setFailedDraft(draft);
      });
  }, [draft, savedDraft, failedDraft, productId, links, saveCustomization]);

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
              {
                groupId: createdId,
                minSelect: null,
                maxSelect: null,
                variants: [],
                defaultModifierIds: null,
              },
            ],
      );
    }, [takeCreatedGroup]),
  );

  const groupById = useMemo(
    () => new Map(groups.map((group) => [group.id, group])),
    [groups],
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
          />

          {/* What it includes is its recipe now. */}
          <ThemedView style={tw`gap-3 mt-4`}>
            <DetailSectionTitle title={t("customization.includes")} />
            <ProductRecipeRow product={product} />
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
          </ThemedView>
        </ScrollViewContainer>

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
              {
                groupId: String(value),
                minSelect: null,
                maxSelect: null,
                variants: [],
                defaultModifierIds: null,
              },
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
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
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
import ButtonGroup from "@/presentation/theme/components/button-group";
import { DetailCard } from "@/presentation/theme/components/detail-card";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import Switch from "@/presentation/theme/components/switch";
import TextInput from "@/presentation/theme/components/text-input";
import ModifierOptionSheet, {
  parseAmount,
  type ModifierOptionDraft,
  type ModifierOptionSheetRef,
} from "@/presentation/menu-management/components/modifier-option-sheet";
import { useModifierGroups } from "@/presentation/menu-management/hooks/useModifierGroups";
import { useGroupLinkHandoff } from "@/presentation/menu-management/store/useGroupLinkHandoff";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import {
  hasVariantRules,
  type ModifierGroup,
  type ProductModifierGroup,
} from "@/core/menu/models/customization.model";
import type { Product } from "@/core/menu/models/product.model";
import IconButton from "@/presentation/theme/components/icon-button";
import GroupProductsSheet, {
  type GroupProductsSheetRef,
} from "@/presentation/menu-management/components/group-products-sheet";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

interface FormState {
  name: string;
  single: boolean;
  required: boolean;
  /** Required and several: one exact amount instead of a min–max range. */
  exact: boolean;
  minSelect: string;
  maxSelect: string;
  isActive: boolean;
  options: ModifierOptionDraft[];
  /** Products that use the group (plans/vincular-desde-grupo.md). */
  productIds: string[];
}

const EMPTY_FORM: FormState = {
  name: "",
  single: true,
  required: false,
  exact: false,
  minSelect: "1",
  maxSelect: "",
  isActive: true,
  options: [],
  productIds: [],
};

const formFromGroup = (group: ModifierGroup): FormState => ({
  name: group.name,
  single: group.maxSelect === 1,
  required: group.minSelect > 0,
  exact:
    group.minSelect > 0 &&
    group.maxSelect !== null &&
    group.maxSelect !== 1 &&
    group.minSelect === group.maxSelect,
  minSelect: String(Math.max(group.minSelect, 1)),
  maxSelect:
    group.maxSelect !== null && group.maxSelect !== 1
      ? String(group.maxSelect)
      : "",
  isActive: group.isActive,
  options: group.modifiers.map((option) => ({
    key: option.id,
    id: option.id,
    name: option.name,
    priceDelta: String(Number(option.priceDelta)),
    isActive: option.isActive,
    isDefault: !!option.isDefault,
    inventoryItemId: option.inventoryItemId,
    inventoryQuantity:
      option.inventoryQuantity !== null
        ? String(Number(option.inventoryQuantity))
        : "",
  })),
  productIds: group.productIds ?? [],
});

/** Compares drafts by content; option keys are only for React. */
const snapshot = (form: FormState) =>
  JSON.stringify({
    ...form,
    options: form.options.map(({ key, ...option }) => option),
    productIds: [...form.productIds].sort(),
  });

/** One option, tapped to edit and long-pressed to move. */
function OptionRow({
  option,
  item,
  isFirst,
  isLast,
  onPress,
  onMove,
}: {
  option: ModifierOptionDraft;
  item?: InventoryItem;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
  onMove: (delta: number) => void;
}) {
  const { t } = useTranslation("menuManagement");
  const drag = useReorderableDrag();
  const price = parseAmount(option.priceDelta);

  const details = [
    option.isDefault && t("modifierGroups.defaultTag"),
    price > 0 ? `+${formatCurrency(price)}` : t("modifierGroups.noExtraCost"),
    item && `${item.name} · ${option.inventoryQuantity} ${item.unit}`,
    !option.isActive && t("modifierGroups.unavailable"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={onPress}
      onLongPress={drag}
      delayLongPress={200}
      accessibilityRole="button"
      accessibilityLabel={`${option.name}, ${details}`}
      accessibilityActions={[
        ...(isFirst
          ? []
          : [{ name: "moveUp", label: t("modifierGroups.moveUp") }]),
        ...(isLast
          ? []
          : [{ name: "moveDown", label: t("modifierGroups.moveDown") }]),
      ]}
      onAccessibilityAction={(event) =>
        onMove(event.nativeEvent.actionName === "moveUp" ? -1 : 1)
      }
      style={({ pressed }) =>
        tw.style(
          "flex-row items-center gap-3 py-3 min-h-16",
          !isLast && "border-b border-divider",
          pressed && "opacity-70",
        )
      }
    >
      <ThemedView
        style={tw.style(
          "flex-1 gap-0.5 bg-transparent",
          !option.isActive && "opacity-50",
        )}
      >
        <ThemedText style={{ fontFamily: typography.medium }} numberOfLines={2}>
          {option.name}
        </ThemedText>
        <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={2}>
          {details}
        </ThemedText>
      </ThemedView>
      <Icon name="grip-vertical" size={20} color={tw.color("gray-400")} />
    </Pressable>
  );
}

/** A product that uses the group: tapped to open its customization. */
function LinkedProductRow({
  product,
  link,
  isLast,
  onPress,
  onUnlink,
}: {
  product: Product;
  /** The saved link; absent until the group saves. */
  link?: ProductModifierGroup;
  isLast: boolean;
  onPress: () => void;
  onUnlink: () => void;
}) {
  const { t } = useTranslation("menuManagement");
  const details = [
    product.category?.name,
    link &&
      (link.minSelect !== null || link.maxSelect !== null) &&
      t("customization.limits.ownTag"),
    link && hasVariantRules(link) && t("customization.limits.variesByVariant"),
    !product.isActive && t("modifierGroups.inactive"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ThemedView
      style={tw.style(
        "flex-row items-center gap-1 bg-transparent",
        !isLast && "border-b border-divider",
      )}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={
          details ? `${product.name}, ${details}` : product.name
        }
        style={({ pressed }) =>
          tw.style(
            "flex-1 py-3 min-h-14 justify-center",
            pressed && "opacity-70",
          )
        }
      >
        <ThemedText style={{ fontFamily: typography.medium }} numberOfLines={2}>
          {product.name}
        </ThemedText>
        {!!details && (
          <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={2}>
            {details}
          </ThemedText>
        )}
      </Pressable>
      <IconButton
        icon="x"
        size={18}
        accessibilityLabel={t("modifierGroups.products.unlink", {
          name: product.name,
        })}
        onPress={onUnlink}
      />
    </ThemedView>
  );
}

/**
 * Creates or edits a group of options: its name, whether the waiter picks
 * one or several, whether it's required, and its options in order (each
 * with a price and, optionally, the insumo it spends).
 */
export default function ModifierGroupFormScreen() {
  const { t } = useTranslation(["menuManagement", "common"]);
  const { groupId, linkToProduct } = useLocalSearchParams<{
    groupId?: string;
    /** Opened from a product's customization: link the new group there. */
    linkToProduct?: string;
  }>();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { groups, groupsQuery, saveGroup, deleteGroup } = useModifierGroups();
  const { items } = useInventoryItems();
  const products = useMenuStore((state) => state.products);
  const group = groupId
    ? groups.find((item) => item.id === groupId)
    : undefined;

  const [name, setName] = useState(EMPTY_FORM.name);
  const [single, setSingle] = useState(EMPTY_FORM.single);
  const [required, setRequired] = useState(EMPTY_FORM.required);
  const [exact, setExact] = useState(EMPTY_FORM.exact);
  const [minSelect, setMinSelect] = useState(EMPTY_FORM.minSelect);
  const [maxSelect, setMaxSelect] = useState(EMPTY_FORM.maxSelect);
  const [isActive, setIsActive] = useState(EMPTY_FORM.isActive);
  const [options, setOptions] = useState<ModifierOptionDraft[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const productsSheetRef = useRef<GroupProductsSheetRef>(null);
  const [showDelete, setShowDelete] = useState(false);
  const optionSheetRef = useRef<ModifierOptionSheetRef>(null);
  const setCreatedGroupId = useGroupLinkHandoff(
    (state) => state.setCreatedGroupId,
  );

  // What the form opened with, to know whether leaving loses anything.
  const [initial, setInitial] = useState<string | null>(() =>
    groupId ? null : snapshot(EMPTY_FORM),
  );

  // Fill the form once the group arrives (set during render, not in an effect).
  if (group && initial === null) {
    const form = formFromGroup(group);
    setName(form.name);
    setSingle(form.single);
    setRequired(form.required);
    setExact(form.exact);
    setMinSelect(form.minSelect);
    setMaxSelect(form.maxSelect);
    setIsActive(form.isActive);
    setOptions(form.options);
    setProductIds(form.productIds);
    setInitial(snapshot(form));
  }

  const isDirty =
    initial !== null &&
    snapshot({
      name,
      single,
      required,
      exact,
      minSelect,
      maxSelect,
      isActive,
      options,
      productIds,
    }) !== initial;

  // Leaving with unsaved edits asks first. Saving or deleting leaves freely.
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

  const usedInCount = group?.productIds?.length ?? 0;
  // Opened from a product's customization, which links the new group itself.
  const editsProducts = !linkToProduct;

  const linkedProducts = useMemo(
    () =>
      products
        .filter((product) => productIds.includes(product.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [products, productIds],
  );

  /** The product's own rule for this group, as the saved link has it. */
  const savedLink = (product: Product) =>
    product.modifierGroups?.find((link) => link.groupId === group?.id);
  const hasOwnRules = (product: Product) => {
    const link = savedLink(product);
    return (
      !!link &&
      (link.minSelect !== null ||
        link.maxSelect !== null ||
        hasVariantRules(link))
    );
  };
  // Unlinking these loses their own limits; saving asks first.
  const unlinkedWithRules = products.filter(
    (product) =>
      group?.productIds?.includes(product.id) &&
      !productIds.includes(product.id) &&
      hasOwnRules(product),
  );

  const unlinkProduct = (product: Product) => {
    setProductIds((current) => current.filter((id) => id !== product.id));
    let undone = false;
    const toastId = toast(
      t("modifierGroups.products.removed", { name: product.name }),
      {
        duration: 8000,
        action: {
          label: t("common:actions.undo"),
          onClick: () => {
            if (undone) return;
            undone = true;
            toast.dismiss(toastId);
            setProductIds((current) =>
              current.includes(product.id) ? current : [...current, product.id],
            );
          },
        },
      },
    );
  };

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const moveOption = (index: number, delta: number) =>
    setOptions((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      return reorderItems(current, index, target);
    });

  const handleOptionSubmit = (option: ModifierOptionDraft) =>
    setOptions((current) => {
      // "Elige 1" has one default: marking another one moves it.
      const others =
        single && option.isDefault
          ? current.map((entry) =>
              entry.isDefault ? { ...entry, isDefault: false } : entry,
            )
          : current;
      return others.some((entry) => entry.key === option.key)
        ? others.map((entry) => (entry.key === option.key ? option : entry))
        : [...others, option];
    });

  // Removing is instant and can be taken back: the group only changes on save.
  const handleOptionRemove = ({ key }: ModifierOptionDraft) => {
    const index = options.findIndex((entry) => entry.key === key);
    if (index === -1) return;
    const removed = options[index];
    setOptions((current) => current.filter((entry) => entry.key !== key));

    let undone = false;
    const toastId = toast(
      t("modifierGroups.optionRemoved", { name: removed.name }),
      {
        duration: 8000,
        action: {
          label: t("common:actions.undo"),
          onClick: () => {
            if (undone) return;
            undone = true;
            toast.dismiss(toastId);
            setOptions((current) => {
              const next = [...current];
              next.splice(Math.min(index, next.length), 0, removed);
              return next;
            });
          },
        },
      },
    );
  };

  // Validation
  const defaultCount = options.filter((option) => option.isDefault).length;
  const minValue = single ? 1 : Math.round(parseAmount(minSelect));
  const maxValue = single
    ? 1
    : required && exact
      ? minValue
      : maxSelect.trim() === ""
        ? null
        : Math.round(parseAmount(maxSelect));
  const problem =
    name.trim().length < 2
      ? t("modifierGroups.errors.name")
      : options.length === 0
        ? t("modifierGroups.errors.noOptions")
        : !single &&
            ((required && !(minValue >= 1)) ||
              (maxValue !== null && !(maxValue >= 1)) ||
              (required && maxValue !== null && minValue > maxValue))
          ? t("modifierGroups.errors.limits")
          : maxValue !== null && defaultCount > maxValue
            ? t("modifierGroups.errors.tooManyDefaults", { count: maxValue })
            : null;

  const handleSave = async (confirmed = false) => {
    if (problem) return;
    if (editsProducts && unlinkedWithRules.length && !confirmed) {
      setShowUnlinkConfirm(true);
      return;
    }
    setShowUnlinkConfirm(false);
    try {
      const saved = await saveGroup.mutateAsync({
        id: group?.id,
        input: {
          name: name.trim(),
          minSelect: required ? minValue : 0,
          maxSelect: maxValue,
          isActive,
          modifiers: options.map((option) => ({
            ...(option.id && { id: option.id }),
            name: option.name,
            priceDelta: parseAmount(option.priceDelta) || 0,
            isActive: option.isActive,
            isDefault: option.isDefault,
            inventoryItemId: option.inventoryItemId,
            inventoryQuantity: option.inventoryItemId
              ? parseAmount(option.inventoryQuantity)
              : null,
          })),
          ...(editsProducts && { productIds }),
        },
      });
      if (!group && linkToProduct) setCreatedGroupId(saved.id);
      leavingRef.current = true;
      router.back();
    } catch {
      // The mutation already shows the error; the edits stay on screen.
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    try {
      await deleteGroup.mutateAsync(group.id);
      setShowDelete(false);
      leavingRef.current = true;
      router.back();
    } catch {
      // The mutation already shows the error.
    }
  };

  if (groupId && !group) {
    return (
      <ScreenLayout style={tw`flex-1 items-center justify-center px-8 gap-4`}>
        <ThemedText type="body1" style={tw`text-gray-500`}>
          {groupsQuery.isLoading ? t("loading") : t("modifierGroups.notFound")}
        </ThemedText>
        <Button
          label={t("common:actions.goBack")}
          variant="outline"
          onPress={() => router.back()}
        />
      </ScreenLayout>
    );
  }

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ScreenLayout style={tw`flex-1`}>
        <ThemedView style={tw`px-4 pt-8 pb-2 flex-row items-center gap-3`}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("common:actions.goBack")}
            hitSlop={12}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
          </Pressable>
          <ThemedText
            type="h3"
            style={{ fontFamily: typography.medium, flex: 1 }}
            numberOfLines={1}
          >
            {group ? group.name : t("modifierGroups.newGroup")}
          </ThemedText>
        </ThemedView>

        <ScrollViewContainer
          contentContainerStyle={tw`px-4 pt-4 pb-10 gap-6`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {usedInCount > 0 && (
            <ThemedView style={tw`flex-row items-start gap-2`}>
              <Icon
                name="link"
                size={16}
                color={tw.color("gray-500")}
                style={tw`mt-0.5`}
              />
              <ThemedText type="body2" style={tw`flex-1 text-gray-600`}>
                {t("modifierGroups.usedInCount", { count: usedInCount })}
              </ThemedText>
            </ThemedView>
          )}

          <TextInput
            label={t("modifierGroups.fields.name")}
            placeholder={t("modifierGroups.fields.namePlaceholder")}
            value={name}
            onChangeText={setName}
            maxLength={60}
            editable={canManage}
          />

          <ThemedView style={tw`gap-3`}>
            <ThemedText style={{ fontFamily: typography.bold }}>
              {t("modifierGroups.fields.howMany")}
            </ThemedText>
            <ThemedView style={tw`flex-row`}>
              <ButtonGroup
                size="small"
                selected={single ? "one" : "many"}
                onChange={(value: string) => setSingle(value === "one")}
                options={[
                  {
                    label: t("modifierGroups.pickOne"),
                    value: "one",
                    icon: "circle-dot",
                  },
                  {
                    label: t("modifierGroups.pickMany"),
                    value: "many",
                    icon: "square-check",
                  },
                ]}
              />
            </ThemedView>
            <Switch
              label={t("modifierGroups.fields.required")}
              value={required}
              onValueChange={setRequired}
              disabled={!canManage}
            />
            {!single && required && (
              <ThemedView style={tw`flex-row`}>
                <ButtonGroup
                  size="small"
                  selected={exact ? "exact" : "range"}
                  onChange={(value: string) => setExact(value === "exact")}
                  options={[
                    { label: t("modifierGroups.fields.exact"), value: "exact" },
                    { label: t("modifierGroups.fields.range"), value: "range" },
                  ]}
                />
              </ThemedView>
            )}
            {!single && required && exact && (
              <TextInput
                label={t("modifierGroups.fields.quantity")}
                value={minSelect}
                onChangeText={setMinSelect}
                keyboardType="number-pad"
              />
            )}
            {!single && !(required && exact) && (
              <ThemedView style={tw`flex-row gap-3`}>
                {required && (
                  <ThemedView style={tw`flex-1`}>
                    <TextInput
                      label={t("modifierGroups.fields.min")}
                      value={minSelect}
                      onChangeText={setMinSelect}
                      keyboardType="number-pad"
                    />
                  </ThemedView>
                )}
                <ThemedView style={tw`flex-1`}>
                  <TextInput
                    label={t("modifierGroups.fields.max")}
                    placeholder={t("modifierGroups.fields.noLimit")}
                    value={maxSelect}
                    onChangeText={setMaxSelect}
                    keyboardType="number-pad"
                  />
                </ThemedView>
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={tw`gap-3`}>
            <ThemedView style={tw`gap-1`}>
              <ThemedText style={{ fontFamily: typography.bold }}>
                {t("modifierGroups.fields.options")}
              </ThemedText>
              {options.length > 1 && (
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("modifierGroups.reorderHint")}
                </ThemedText>
              )}
            </ThemedView>
            {options.length > 0 && (
              <DetailCard style={tw`py-1`}>
                <NestedReorderableList
                  data={options}
                  keyExtractor={(option) => option.key}
                  scrollEnabled={false}
                  onReorder={({ from, to }) =>
                    setOptions((current) => reorderItems(current, from, to))
                  }
                  renderItem={({ item: option, index }) => (
                    <OptionRow
                      option={option}
                      item={
                        option.inventoryItemId
                          ? itemById.get(option.inventoryItemId)
                          : undefined
                      }
                      isFirst={index === 0}
                      isLast={index === options.length - 1}
                      onPress={() => optionSheetRef.current?.present(option)}
                      onMove={(delta) => moveOption(index, delta)}
                    />
                  )}
                />
              </DetailCard>
            )}
            <Button
              variant="outline"
              leftIcon="plus"
              label={t("modifierGroups.addOption")}
              onPress={() => optionSheetRef.current?.present()}
            />
          </ThemedView>

          {editsProducts && (
            <ThemedView style={tw`gap-3`}>
              <ThemedText style={{ fontFamily: typography.bold }}>
                {t("modifierGroups.products.title")}
              </ThemedText>
              {linkedProducts.length > 0 ? (
                <DetailCard style={tw`py-1 pr-2`}>
                  {linkedProducts.map((product, index) => (
                    <LinkedProductRow
                      key={product.id}
                      product={product}
                      link={savedLink(product)}
                      isLast={index === linkedProducts.length - 1}
                      onPress={() =>
                        router.push({
                          pathname: "/(profile)/menu/products/customization",
                          params: { productId: product.id },
                        })
                      }
                      onUnlink={() => unlinkProduct(product)}
                    />
                  ))}
                </DetailCard>
              ) : (
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {t("modifierGroups.notUsed")}
                </ThemedText>
              )}
              <Button
                variant="outline"
                leftIcon="link"
                label={t("modifierGroups.products.link")}
                onPress={() => productsSheetRef.current?.present(productIds)}
              />
            </ThemedView>
          )}

          {group && (
            <Switch
              label={t("modifierGroups.fields.active")}
              value={isActive}
              onValueChange={setIsActive}
              disabled={!canManage}
            />
          )}

          {group && canManage && (
            <ThemedView style={tw`items-center mt-12`}>
              <Button
                label={t("modifierGroups.delete")}
                leftIcon="trash"
                variant="text"
                size="small"
                onPress={() => setShowDelete(true)}
              />
            </ThemedView>
          )}
        </ScrollViewContainer>

        {canManage && (
          <ThemedView style={tw`px-4 pt-2 pb-4 gap-2`}>
            {problem && (
              <ThemedText type="small" style={tw`text-gray-600 text-center`}>
                {problem}
              </ThemedText>
            )}
            <Button
              label={t("modifierGroups.save")}
              onPress={() => handleSave()}
              loading={saveGroup.isPending}
              disabled={!!problem || saveGroup.isPending}
            />
          </ThemedView>
        )}

        <ModifierOptionSheet
          ref={optionSheetRef}
          items={items}
          onSubmit={handleOptionSubmit}
          onRemove={handleOptionRemove}
        />

        <DialogModal
          visible={showDelete}
          title={t("modifierGroups.deleteTitle")}
          message={t("modifierGroups.deleteMessage", {
            count: usedInCount,
          })}
          confirmLabel={t("modifierGroups.delete")}
          confirmVariant="destructive"
          cancelLabel={t("common:actions.cancel")}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleteGroup.isPending}
        />

        <GroupProductsSheet
          ref={productsSheetRef}
          products={products}
          onSubmit={setProductIds}
        />

        <DialogModal
          visible={showUnlinkConfirm}
          title={t("modifierGroups.products.unlinkTitle")}
          message={t("modifierGroups.products.unlinkMessage", {
            count: unlinkedWithRules.length,
            names: unlinkedWithRules.map((product) => product.name).join(", "),
          })}
          confirmLabel={t("modifierGroups.save")}
          cancelLabel={t("modifierGroups.keepEditing")}
          onConfirm={() => handleSave(true)}
          onCancel={() => setShowUnlinkConfirm(false)}
          loading={saveGroup.isPending}
        />

        <DialogModal
          visible={showDiscard}
          title={t("modifierGroups.discardTitle")}
          message={t("modifierGroups.discardMessage")}
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

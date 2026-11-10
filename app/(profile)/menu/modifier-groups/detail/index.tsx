import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import DetailHeader from "@/presentation/theme/components/detail-header";
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { describeRule } from "@/presentation/menu-management/components/group-limits-sheet";
import {
  modifierGroupsQueryKey,
  useModifierGroups,
} from "@/presentation/menu-management/hooks/useModifierGroups";
import GroupProductsSheet, {
  type GroupProductsSheetRef,
} from "@/presentation/menu-management/components/group-products-sheet";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import {
  hasVariantRules,
  type ModifierGroup,
  type ModifierOption,
} from "@/core/menu/models/customization.model";
import type { SaveModifierGroupInput } from "@/presentation/menu-management/services/modifier-groups.service";
import type { Product } from "@/core/menu/models/product.model";

/** Price, default, insumo and availability of an option, in one line. */
const optionDetails = (t: (key: string) => string, option: ModifierOption) => {
  const price = Number(option.priceDelta);
  const item = option.inventoryItem;
  return [
    option.isDefault && t("modifierGroups.defaultTag"),
    price > 0 ? `+${formatCurrency(price)}` : t("modifierGroups.noExtraCost"),
    item &&
      option.inventoryQuantity !== null &&
      `${item.name} · ${Number(option.inventoryQuantity)} ${item.unit}`,
    !option.isActive && t("modifierGroups.unavailable"),
  ]
    .filter(Boolean)
    .join(" · ");
};

/** What saving the group as it is takes; changes go on top. */
const inputFromGroup = (group: ModifierGroup): SaveModifierGroupInput => ({
  name: group.name,
  minSelect: group.minSelect,
  maxSelect: group.maxSelect,
  isActive: group.isActive,
  modifiers: group.modifiers.map((option) => ({
    id: option.id,
    name: option.name,
    priceDelta: Number(option.priceDelta),
    isActive: option.isActive,
    isDefault: !!option.isDefault,
    inventoryItemId: option.inventoryItemId,
    inventoryQuantity:
      option.inventoryQuantity !== null
        ? Number(option.inventoryQuantity)
        : null,
  })),
});

/** The group as saved right now, for an undo that comes later. */
const latestGroup = (groupId: string) =>
  queryClient
    .getQueryData<ModifierGroup[]>(modifierGroupsQueryKey)
    ?.find((group) => group.id === groupId);

/**
 * One group of options, read-only: what the waiter is asked, its options
 * and the products that use it. Editing happens in the form.
 */
export default function ModifierGroupDetailScreen() {
  const { t } = useTranslation(["menuManagement", "common"]);
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { groups, groupsQuery, saveGroup, deleteGroup } = useModifierGroups();
  const products = useMenuStore((state) => state.products);

  const [showDelete, setShowDelete] = useState(false);
  const moreSheetRef = useRef<BottomSheetMethods>(null);
  const productsSheetRef = useRef<GroupProductsSheetRef>(null);
  // Links waiting for a yes, since some products lose their own limits.
  const [pendingIds, setPendingIds] = useState<string[] | null>(null);

  const group = groups.find((item) => item.id === groupId);

  // Deleted here or from the form: nothing left to show. Only while on
  // screen, so a form above it leaves on its own first.
  const [hadGroup, setHadGroup] = useState(false);
  if (group && !hadGroup) setHadGroup(true);
  useFocusEffect(
    useCallback(() => {
      if (!group && hadGroup) router.back();
    }, [group, hadGroup]),
  );

  const linkedProducts = useMemo(
    () =>
      products
        .filter((product) => group?.productIds?.includes(product.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [products, group?.productIds],
  );

  const handleEdit = () =>
    router.push({
      pathname: "/(profile)/menu/modifier-groups/form",
      params: { groupId },
    });

  const setActive = (current: ModifierGroup, isActive: boolean) => {
    moreSheetRef.current?.dismiss();
    saveGroup.mutate({
      id: current.id,
      input: { ...inputFromGroup(current), isActive },
    });
  };

  /** The product's own rule for this group, which unlinking loses. */
  const hasOwnRules = (product: Product) => {
    const link = product.modifierGroups?.find(
      (entry) => entry.groupId === groupId,
    );
    return (
      !!link &&
      (link.minSelect !== null ||
        link.maxSelect !== null ||
        hasVariantRules(link))
    );
  };

  /** Saves which products use the group; links save right away. */
  const saveLinks = (productIds: string[], onSuccess?: () => void) => {
    const current = latestGroup(groupId);
    if (!current) return;
    saveGroup.mutate(
      {
        id: current.id,
        input: { ...inputFromGroup(current), productIds },
        quiet: true,
      },
      { onSuccess },
    );
  };

  // Picked in the sheet: asks first when a product would lose its limits.
  const handleLinksPicked = (productIds: string[]) => {
    const losing = linkedProducts.some(
      (product) => !productIds.includes(product.id) && hasOwnRules(product),
    );
    if (losing) setPendingIds(productIds);
    else
      saveLinks(productIds, () =>
        toast.success(t("modifierGroups.products.updated")),
      );
  };

  // One product off the group, with a way back unless its limits would go.
  const handleUnlink = (product: Product) => {
    const productIds = (group?.productIds ?? []).filter(
      (id) => id !== product.id,
    );
    if (hasOwnRules(product)) {
      setPendingIds(productIds);
      return;
    }
    saveLinks(productIds, () => {
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
              const ids = latestGroup(groupId)?.productIds ?? [];
              if (!ids.includes(product.id)) saveLinks([...ids, product.id]);
            },
          },
        },
      );
    });
  };

  const losingLimits = pendingIds
    ? linkedProducts.filter(
        (product) => !pendingIds.includes(product.id) && hasOwnRules(product),
      )
    : [];

  const handleDelete = async () => {
    if (!group) return;
    try {
      await deleteGroup.mutateAsync(group.id);
      setShowDelete(false);
    } catch {
      // The mutation already shows the error.
    }
  };

  const header = (
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
  );

  if (!group) {
    return (
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        {header}
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {groupsQuery.isLoading
              ? t("loading")
              : t("modifierGroups.notFound")}
          </ThemedText>
        </ThemedView>
      </ScreenLayout>
    );
  }

  const availableCount = group.modifiers.filter(
    (option) => option.isActive,
  ).length;
  // Asks for more than are available now, so the waiter can't complete it.
  const shortOfAvailable =
    group.minSelect <= group.modifiers.length &&
    group.minSelect > availableCount;
  const usedInCount = group.productIds?.length ?? 0;

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      {header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={groupsQuery.isRefetching}
            onRefresh={groupsQuery.refetch}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        <DetailHeader
          title={group.name}
          subtitle={describeRule(t, group.minSelect, group.maxSelect)}
          status={
            !group.isActive && <Label text={t("modifierGroups.inactive")} />
          }
        >
          {canManage && (
            <ThemedView style={tw`flex-row flex-wrap gap-3`}>
              {!group.isActive && (
                // Inactive: bringing it back is the main action
                <Button
                  label={t("activate")}
                  leftIcon="eye"
                  shape="rounded"
                  size="small"
                  loading={saveGroup.isPending}
                  disabled={saveGroup.isPending}
                  onPress={() => setActive(group, true)}
                />
              )}
              <Button
                label={t("edit")}
                leftIcon="square-pen"
                variant="surface"
                shape="rounded"
                size="small"
                onPress={handleEdit}
              />
              <Button
                leftIcon="ellipsis"
                variant="surface"
                shape="rounded"
                size="small"
                accessibilityLabel={t("common:actions.more")}
                onPress={() => moreSheetRef.current?.present()}
              />
            </ThemedView>
          )}
        </DetailHeader>

        {shortOfAvailable && (
          <ThemedView
            style={tw`flex-row items-start gap-2 rounded-md bg-orange-100 p-3`}
          >
            <Icon
              name="triangle-alert"
              size={18}
              color={tw.color("orange-700")}
            />
            <ThemedText type="small" style={tw`flex-1 text-orange-700`}>
              {t("modifierGroups.fewAvailable", {
                count: availableCount,
                min: group.minSelect,
              })}
            </ThemedText>
          </ThemedView>
        )}

        {/* Options, in the order the waiter sees them */}
        <ThemedView style={tw`gap-3 mt-4`}>
          <DetailSectionTitle
            title={t("modifierGroups.fields.options")}
            action={
              <ThemedText type="small" style={tw`text-gray-500`}>
                {group.modifiers.length}
              </ThemedText>
            }
          />
          <DetailCard style={tw`py-1`}>
            {[...group.modifiers]
              .sort((a, b) => a.order - b.order)
              .map((option, index, shown) => (
                <ThemedView
                  key={option.id}
                  accessible
                  accessibilityLabel={`${option.name}, ${optionDetails(t, option)}`}
                  style={tw.style(
                    "gap-0.5 py-3",
                    index < shown.length - 1 && "border-b border-divider",
                    !option.isActive && "opacity-50",
                  )}
                >
                  <ThemedText
                    style={{ fontFamily: typography.medium }}
                    numberOfLines={2}
                  >
                    {option.name}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={tw`text-gray-500`}
                    numberOfLines={2}
                  >
                    {optionDetails(t, option)}
                  </ThemedText>
                </ThemedView>
              ))}
          </DetailCard>
        </ThemedView>

        {/* Products: a change to the group reaches every one of them */}
        <ThemedView style={tw`gap-3 mt-4`}>
          <DetailSectionTitle
            title={t("modifierGroups.products.title")}
            action={
              // With none yet, the button sits in the card instead
              canManage &&
              linkedProducts.length > 0 && (
                <Button
                  label={t("modifierGroups.products.linkShort")}
                  accessibilityLabel={t("modifierGroups.products.link")}
                  leftIcon="link"
                  variant="outline"
                  size="extra-small"
                  onPress={() =>
                    productsSheetRef.current?.present(group.productIds ?? [])
                  }
                />
              )
            }
          />
          <DetailCard
            style={tw.style(
              "py-1",
              canManage && linkedProducts.length > 0 && "pr-2",
            )}
          >
            {linkedProducts.length ? (
              linkedProducts.map((product, index) => {
                const details = [
                  product.category?.name,
                  hasOwnRules(product) && t("customization.limits.ownTag"),
                  !product.isActive && t("modifierGroups.inactive"),
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <ThemedView
                    key={product.id}
                    style={tw.style(
                      "flex-row items-center gap-1",
                      index < linkedProducts.length - 1 &&
                        "border-b border-divider",
                    )}
                  >
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/(profile)/menu/products/customization",
                          params: { productId: product.id },
                        })
                      }
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
                      <ThemedText numberOfLines={2}>{product.name}</ThemedText>
                      {!!details && (
                        <ThemedText
                          type="small"
                          style={tw`text-gray-500`}
                          numberOfLines={2}
                        >
                          {details}
                        </ThemedText>
                      )}
                    </Pressable>
                    {canManage && (
                      <IconButton
                        icon="x"
                        size={18}
                        disabled={saveGroup.isPending}
                        accessibilityLabel={t(
                          "modifierGroups.products.unlink",
                          {
                            name: product.name,
                          },
                        )}
                        onPress={() => handleUnlink(product)}
                      />
                    )}
                  </ThemedView>
                );
              })
            ) : (
              <ThemedView style={tw`items-center gap-3 py-4`}>
                <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
                  {t("modifierGroups.notUsed")}
                </ThemedText>
                {canManage && (
                  <Button
                    label={t("modifierGroups.products.link")}
                    leftIcon="link"
                    variant="outline"
                    size="small"
                    onPress={() => productsSheetRef.current?.present([])}
                  />
                )}
              </ThemedView>
            )}
          </DetailCard>
        </ThemedView>
      </ScrollView>

      <ThemedBottomSheetModal ref={moreSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={group.name}
          items={[
            // Activate lives in the header while inactive
            ...(group.isActive
              ? [
                  {
                    icon: "eye-off" as const,
                    label: t("deactivate"),
                    onPress: () => setActive(group, false),
                    disabled: saveGroup.isPending,
                  },
                ]
              : []),
            {
              icon: "trash",
              label: t("modifierGroups.delete"),
              color: "text-red-600",
              onPress: () => {
                moreSheetRef.current?.dismiss();
                setShowDelete(true);
              },
            },
          ]}
        />
      </ThemedBottomSheetModal>

      <DialogModal
        visible={showDelete}
        title={t("modifierGroups.deleteTitle")}
        message={t("modifierGroups.deleteMessage", { count: usedInCount })}
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
        onSubmit={handleLinksPicked}
      />

      <DialogModal
        visible={!!pendingIds}
        title={t("modifierGroups.products.unlinkTitle")}
        message={t("modifierGroups.products.unlinkMessage", {
          count: losingLimits.length,
          names: losingLimits.map((product) => product.name).join(", "),
        })}
        confirmLabel={t("modifierGroups.products.unlinkConfirm")}
        confirmVariant="destructive"
        cancelLabel={t("common:actions.cancel")}
        onConfirm={() =>
          pendingIds &&
          saveLinks(pendingIds, () => {
            setPendingIds(null);
            toast.success(t("modifierGroups.products.updated"));
          })
        }
        onCancel={() => setPendingIds(null)}
        loading={saveGroup.isPending}
      />
    </ScreenLayout>
  );
}

import { useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import IconButton from "@/presentation/theme/components/icon-button";
import Switch from "@/presentation/theme/components/switch";
import TextInput from "@/presentation/theme/components/text-input";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { useModifierGroups } from "@/presentation/menu-management/hooks/useModifierGroups";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { getProductComponents } from "@/core/menu/models/customization.model";

interface ComponentDraft {
  key: string;
  id?: string;
  name: string;
  removable: boolean;
  /** Shown positive ("1.50"); saved as a negative change. */
  discount: string;
  inventoryItemId: string | null;
  inventoryQuantity: string;
}

interface GroupLinkDraft {
  groupId: string;
  minSelect: number | null;
  maxSelect: number | null;
}

let draftKey = 0;

const toNumber = (value: string) => {
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
};

/**
 * A product's "Personalización": the items it includes (which the waiter
 * may take off, maybe for less) and the shared groups of options it offers,
 * in the order the order screen shows them.
 */
export default function ProductCustomizationScreen() {
  const { t } = useTranslation(["menuManagement", "common"]);
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const product = useMenuStore((state) =>
    state.products.find((item) => item.id === productId),
  );
  const { groups, saveProductCustomization } = useModifierGroups();
  const { items } = useInventoryItems();

  const [components, setComponents] = useState<ComponentDraft[]>(() =>
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
      })),
  );
  const itemPickerRef = useRef<BottomSheetPickerRef>(null);
  const groupPickerRef = useRef<BottomSheetPickerRef>(null);
  const [pickingFor, setPickingFor] = useState<string | null>(null);

  const groupById = useMemo(
    () => new Map(groups.map((group) => [group.id, group])),
    [groups],
  );
  const linkedGroupName = (groupId: string) =>
    groupById.get(groupId)?.name ??
    product?.modifierGroups?.find((link) => link.groupId === groupId)?.group
      ?.name ??
    "";

  const updateComponent = (key: string, change: Partial<ComponentDraft>) =>
    setComponents((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, ...change } : entry)),
    );

  const move = <T,>(list: T[], index: number, delta: number) => {
    const next = [...list];
    const target = index + delta;
    if (target < 0 || target >= next.length) return list;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  };

  const itemName = (id: string | null) => {
    const item = id ? items.find((entry) => entry.id === id) : undefined;
    return item ? `${item.name} (${item.unit})` : null;
  };

  const filled = components.filter((entry) => entry.name.trim() !== "");
  const problem = filled.some(
    (entry) =>
      (entry.removable &&
        entry.discount.trim() !== "" &&
        !(toNumber(entry.discount) >= 0)) ||
      (entry.inventoryItemId && !(toNumber(entry.inventoryQuantity) > 0)),
  )
    ? t("customization.errors.values")
    : null;

  const handleSave = async () => {
    if (!product || problem) return;
    await saveProductCustomization.mutateAsync({
      productId: product.id,
      input: {
        components: filled.map((entry) => ({
          ...(entry.id && { id: entry.id }),
          name: entry.name.trim(),
          removable: entry.removable,
          removalPriceDelta:
            entry.removable && entry.discount.trim() !== ""
              ? -Math.abs(toNumber(entry.discount))
              : 0,
          inventoryItemId: entry.inventoryItemId,
          inventoryQuantity: entry.inventoryItemId
            ? toNumber(entry.inventoryQuantity)
            : null,
        })),
        groups: links,
      },
    });
    router.back();
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
      <ScreenLayout style={tw`flex-1`}>
        <ThemedView style={tw`px-4 pt-8 pb-2 flex-row items-center gap-3`}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("common:actions.goBack")}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
          </Pressable>
          <ThemedView style={tw`flex-1`}>
            <ThemedText
              type="h3"
              style={{ fontFamily: typography.medium }}
              numberOfLines={1}
            >
              {t("customization.title")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`} numberOfLines={1}>
              {product.name}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ScrollView
          contentContainerStyle={tw`px-4 pt-4 pb-10 gap-8`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Included items */}
          <ThemedView style={tw`gap-3`}>
            <ThemedView style={tw`gap-1`}>
              <ThemedText style={{ fontFamily: typography.bold }}>
                {t("customization.includes")}
              </ThemedText>
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("customization.includesHint")}
              </ThemedText>
            </ThemedView>
            {components.map((entry, index) => (
              <Card key={entry.key} variant="outline" style={tw`p-4 gap-3`}>
                <TextInput
                  label={t("customization.fields.itemName")}
                  placeholder={t("customization.fields.itemPlaceholder")}
                  value={entry.name}
                  onChangeText={(value) =>
                    updateComponent(entry.key, { name: value })
                  }
                  maxLength={60}
                />
                <Switch
                  label={t("customization.fields.removable")}
                  value={entry.removable}
                  onValueChange={(value) =>
                    updateComponent(entry.key, { removable: value })
                  }
                />
                {entry.removable && (
                  <TextInput
                    label={t("customization.fields.discount")}
                    placeholder="0"
                    value={entry.discount}
                    onChangeText={(value) =>
                      updateComponent(entry.key, { discount: value })
                    }
                    keyboardType="decimal-pad"
                  />
                )}
                <Pressable
                  onPress={() => {
                    setPickingFor(entry.key);
                    itemPickerRef.current?.present();
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    tw`flex-row items-center gap-3 min-h-12`,
                    pressed && tw`opacity-60`,
                  ]}
                >
                  <Icon name="package" size={18} color={tw.color("gray-500")} />
                  <ThemedText type="body2" style={tw`flex-1`}>
                    {itemName(entry.inventoryItemId) ??
                      t("modifierGroups.fields.noInventoryItem")}
                  </ThemedText>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={tw.color("gray-400")}
                  />
                </Pressable>
                {entry.inventoryItemId && (
                  <TextInput
                    label={t("modifierGroups.fields.inventoryQuantity")}
                    value={entry.inventoryQuantity}
                    onChangeText={(value) =>
                      updateComponent(entry.key, { inventoryQuantity: value })
                    }
                    keyboardType="decimal-pad"
                  />
                )}
                <ThemedView style={tw`flex-row justify-end gap-1 bg-transparent`}>
                  <IconButton
                    icon="arrow-up"
                    size={18}
                    disabled={index === 0}
                    onPress={() =>
                      setComponents((current) => move(current, index, -1))
                    }
                    accessibilityLabel={t("modifierGroups.moveUp")}
                  />
                  <IconButton
                    icon="arrow-down"
                    size={18}
                    disabled={index === components.length - 1}
                    onPress={() =>
                      setComponents((current) => move(current, index, 1))
                    }
                    accessibilityLabel={t("modifierGroups.moveDown")}
                  />
                  <IconButton
                    icon="trash"
                    size={18}
                    onPress={() =>
                      setComponents((current) =>
                        current.filter((item) => item.key !== entry.key),
                      )
                    }
                    accessibilityLabel={t("customization.removeItem")}
                  />
                </ThemedView>
              </Card>
            ))}
            <Button
              variant="outline"
              leftIcon="plus"
              label={t("customization.addItem")}
              onPress={() =>
                setComponents((current) => [
                  ...current,
                  {
                    key: `new-${++draftKey}`,
                    name: "",
                    removable: true,
                    discount: "",
                    inventoryItemId: null,
                    inventoryQuantity: "",
                  },
                ])
              }
            />
          </ThemedView>

          {/* Linked groups */}
          <ThemedView style={tw`gap-3`}>
            <ThemedView style={tw`gap-1`}>
              <ThemedText style={{ fontFamily: typography.bold }}>
                {t("customization.groups")}
              </ThemedText>
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("customization.groupsHint")}
              </ThemedText>
            </ThemedView>
            {links.map((link, index) => {
              const group = groupById.get(link.groupId);
              return (
                <Card
                  key={link.groupId}
                  variant="outline"
                  style={tw`px-4 py-3 flex-row items-center gap-2`}
                >
                  <ThemedView style={tw`flex-1 bg-transparent`}>
                    <ThemedText style={{ fontFamily: typography.medium }}>
                      {linkedGroupName(link.groupId)}
                    </ThemedText>
                    {group && (
                      <ThemedText
                        type="small"
                        style={tw`text-gray-500`}
                        numberOfLines={1}
                      >
                        {group.modifiers.map((option) => option.name).join(", ")}
                      </ThemedText>
                    )}
                  </ThemedView>
                  <IconButton
                    icon="arrow-up"
                    size={18}
                    disabled={index === 0}
                    onPress={() => setLinks((current) => move(current, index, -1))}
                    accessibilityLabel={t("modifierGroups.moveUp")}
                  />
                  <IconButton
                    icon="arrow-down"
                    size={18}
                    disabled={index === links.length - 1}
                    onPress={() => setLinks((current) => move(current, index, 1))}
                    accessibilityLabel={t("modifierGroups.moveDown")}
                  />
                  <IconButton
                    icon="x"
                    size={18}
                    onPress={() =>
                      setLinks((current) =>
                        current.filter((item) => item.groupId !== link.groupId),
                      )
                    }
                    accessibilityLabel={t("customization.unlinkGroup")}
                  />
                </Card>
              );
            })}
            <ThemedView style={tw`flex-row gap-2`}>
              <Button
                style={tw`flex-1`}
                variant="outline"
                leftIcon="plus"
                label={t("customization.linkGroup")}
                onPress={() => groupPickerRef.current?.present()}
              />
              <Button
                variant="text"
                label={t("customization.manageGroups")}
                onPress={() => router.push("/(profile)/menu/modifier-groups")}
              />
            </ThemedView>
          </ThemedView>
        </ScrollView>

        <ThemedView style={tw`px-4 pt-2 pb-4 gap-2`}>
          {problem && (
            <ThemedText type="small" style={tw`text-gray-600 text-center`}>
              {problem}
            </ThemedText>
          )}
          <Button
            label={t("customization.save")}
            onPress={handleSave}
            loading={saveProductCustomization.isPending}
            disabled={!!problem || saveProductCustomization.isPending}
          />
        </ThemedView>

        <BottomSheetPicker
          ref={itemPickerRef}
          title={t("modifierGroups.fields.inventoryItem")}
          searchable
          options={[
            { label: t("modifierGroups.fields.noInventoryItem"), value: "" },
            ...items
              .filter((item) => item.isActive)
              .map((item) => ({
                label: item.name,
                value: item.id,
                description: item.unit,
              })),
          ]}
          value={
            components.find((entry) => entry.key === pickingFor)
              ?.inventoryItemId ?? ""
          }
          onChange={(value) => {
            if (!pickingFor) return;
            updateComponent(pickingFor, {
              inventoryItemId: value ? String(value) : null,
            });
          }}
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
              { groupId: String(value), minSelect: null, maxSelect: null },
            ])
          }
          headerAction={{
            label: t("modifierGroups.newGroup"),
            onPress: () => {
              groupPickerRef.current?.dismiss();
              router.push("/(profile)/menu/modifier-groups/form");
            },
          }}
        />
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}

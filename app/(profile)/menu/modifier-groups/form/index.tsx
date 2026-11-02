import { useEffect, useMemo, useRef, useState } from "react";
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
import ButtonGroup from "@/presentation/theme/components/button-group";
import Card from "@/presentation/theme/components/card";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import IconButton from "@/presentation/theme/components/icon-button";
import Switch from "@/presentation/theme/components/switch";
import TextInput from "@/presentation/theme/components/text-input";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { useModifierGroups } from "@/presentation/menu-management/hooks/useModifierGroups";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";

interface OptionDraft {
  key: string;
  id?: string;
  name: string;
  priceDelta: string;
  isActive: boolean;
  inventoryItemId: string | null;
  inventoryQuantity: string;
}

let draftKey = 0;
const newOption = (): OptionDraft => ({
  key: `new-${++draftKey}`,
  name: "",
  priceDelta: "0",
  isActive: true,
  inventoryItemId: null,
  inventoryQuantity: "",
});

const toNumber = (value: string) => {
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
};

/**
 * Creates or edits a group of options: its name, whether the waiter picks
 * one or several, whether it's required, and its options in order (each
 * with a price and, optionally, the insumo it spends).
 */
export default function ModifierGroupFormScreen() {
  const { t } = useTranslation(["menuManagement", "common"]);
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { groups, groupsQuery, saveGroup, deleteGroup } = useModifierGroups();
  const { items } = useInventoryItems();
  const products = useMenuStore((state) => state.products);
  const group = groupId ? groups.find((item) => item.id === groupId) : undefined;

  const [name, setName] = useState("");
  const [single, setSingle] = useState(true);
  const [required, setRequired] = useState(false);
  const [minSelect, setMinSelect] = useState("1");
  const [maxSelect, setMaxSelect] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [options, setOptions] = useState<OptionDraft[]>([newOption()]);
  const [showDelete, setShowDelete] = useState(false);
  const loadedRef = useRef(false);
  const itemPickerRef = useRef<BottomSheetPickerRef>(null);
  const [pickingFor, setPickingFor] = useState<string | null>(null);

  useEffect(() => {
    if (!group || loadedRef.current) return;
    loadedRef.current = true;
    setName(group.name);
    setSingle(group.maxSelect === 1);
    setRequired(group.minSelect > 0);
    setMinSelect(String(Math.max(group.minSelect, 1)));
    setMaxSelect(
      group.maxSelect !== null && group.maxSelect !== 1
        ? String(group.maxSelect)
        : "",
    );
    setIsActive(group.isActive);
    setOptions(
      group.modifiers.map((option) => ({
        key: option.id,
        id: option.id,
        name: option.name,
        priceDelta: String(option.priceDelta),
        isActive: option.isActive,
        inventoryItemId: option.inventoryItemId,
        inventoryQuantity:
          option.inventoryQuantity !== null
            ? String(option.inventoryQuantity)
            : "",
      })),
    );
  }, [group]);

  const usedIn = useMemo(
    () =>
      products
        .filter((product) => group?.productIds?.includes(product.id))
        .map((product) => product.name)
        .sort((a, b) => a.localeCompare(b)),
    [products, group],
  );

  const updateOption = (key: string, change: Partial<OptionDraft>) =>
    setOptions((current) =>
      current.map((option) =>
        option.key === key ? { ...option, ...change } : option,
      ),
    );

  const moveOption = (index: number, delta: number) =>
    setOptions((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const itemName = (id: string | null) => {
    const item = id ? items.find((entry) => entry.id === id) : undefined;
    return item ? `${item.name} (${item.unit})` : null;
  };

  // Validation
  const minValue = single ? 1 : Math.round(toNumber(minSelect));
  const maxValue = single
    ? 1
    : maxSelect.trim() === ""
      ? null
      : Math.round(toNumber(maxSelect));
  const filledOptions = options.filter((option) => option.name.trim() !== "");
  const problem =
    name.trim().length < 2
      ? t("modifierGroups.errors.name")
      : filledOptions.length === 0
        ? t("modifierGroups.errors.noOptions")
        : filledOptions.some(
              (option) =>
                !(toNumber(option.priceDelta) >= 0) ||
                (option.inventoryItemId &&
                  !(toNumber(option.inventoryQuantity) > 0)),
            )
          ? t("modifierGroups.errors.optionValues")
          : !single &&
              ((required && !(minValue >= 1)) ||
                (maxValue !== null && !(maxValue >= 1)) ||
                (required && maxValue !== null && minValue > maxValue))
            ? t("modifierGroups.errors.limits")
            : null;

  const handleSave = async () => {
    if (problem) return;
    await saveGroup.mutateAsync({
      id: group?.id,
      input: {
        name: name.trim(),
        minSelect: required ? minValue : 0,
        maxSelect: maxValue,
        isActive,
        modifiers: filledOptions.map((option) => ({
          ...(option.id && { id: option.id }),
          name: option.name.trim(),
          priceDelta: toNumber(option.priceDelta),
          isActive: option.isActive,
          inventoryItemId: option.inventoryItemId,
          inventoryQuantity: option.inventoryItemId
            ? toNumber(option.inventoryQuantity)
            : null,
        })),
      },
    });
    router.back();
  };

  const handleDelete = async () => {
    if (!group) return;
    await deleteGroup.mutateAsync(group.id);
    setShowDelete(false);
    router.back();
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
          {group && canManage && (
            <IconButton
              icon="trash"
              variant="destructive"
              onPress={() => setShowDelete(true)}
              accessibilityLabel={t("modifierGroups.delete")}
            />
          )}
        </ThemedView>

        <ScrollView
          contentContainerStyle={tw`px-4 pt-4 pb-10 gap-6`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            {!single && (
              <ThemedView style={tw`flex-row gap-3`}>
                {required && (
                  <TextInput
                    containerStyle={tw`flex-1`}
                    label={t("modifierGroups.fields.min")}
                    value={minSelect}
                    onChangeText={setMinSelect}
                    keyboardType="number-pad"
                  />
                )}
                <TextInput
                  containerStyle={tw`flex-1`}
                  label={t("modifierGroups.fields.max")}
                  placeholder={t("modifierGroups.fields.noLimit")}
                  value={maxSelect}
                  onChangeText={setMaxSelect}
                  keyboardType="number-pad"
                />
              </ThemedView>
            )}
            <Switch
              label={t("modifierGroups.fields.active")}
              value={isActive}
              onValueChange={setIsActive}
              disabled={!canManage}
            />
          </ThemedView>

          <ThemedView style={tw`gap-3`}>
            <ThemedText style={{ fontFamily: typography.bold }}>
              {t("modifierGroups.fields.options")}
            </ThemedText>
            {options.map((option, index) => (
              <Card key={option.key} variant="outline" style={tw`p-4 gap-3`}>
                <ThemedView style={tw`flex-row items-start gap-2 bg-transparent`}>
                  <TextInput
                    containerStyle={tw`flex-1`}
                    label={t("modifierGroups.fields.optionName")}
                    value={option.name}
                    onChangeText={(value) =>
                      updateOption(option.key, { name: value })
                    }
                    maxLength={60}
                  />
                  <TextInput
                    containerStyle={{ width: 110 }}
                    label={t("modifierGroups.fields.priceDelta")}
                    value={option.priceDelta}
                    onChangeText={(value) =>
                      updateOption(option.key, { priceDelta: value })
                    }
                    keyboardType="decimal-pad"
                  />
                </ThemedView>

                <Pressable
                  onPress={() => {
                    setPickingFor(option.key);
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
                    {itemName(option.inventoryItemId) ??
                      t("modifierGroups.fields.noInventoryItem")}
                  </ThemedText>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={tw.color("gray-400")}
                  />
                </Pressable>
                {option.inventoryItemId && (
                  <TextInput
                    label={t("modifierGroups.fields.inventoryQuantity")}
                    value={option.inventoryQuantity}
                    onChangeText={(value) =>
                      updateOption(option.key, { inventoryQuantity: value })
                    }
                    keyboardType="decimal-pad"
                  />
                )}

                <ThemedView
                  style={tw`flex-row items-center justify-between bg-transparent`}
                >
                  <Switch
                    label={t("modifierGroups.fields.optionActive")}
                    value={option.isActive}
                    onValueChange={(value) =>
                      updateOption(option.key, { isActive: value })
                    }
                  />
                  <ThemedView style={tw`flex-row gap-1 bg-transparent`}>
                    <IconButton
                      icon="arrow-up"
                      size={18}
                      disabled={index === 0}
                      onPress={() => moveOption(index, -1)}
                      accessibilityLabel={t("modifierGroups.moveUp")}
                    />
                    <IconButton
                      icon="arrow-down"
                      size={18}
                      disabled={index === options.length - 1}
                      onPress={() => moveOption(index, 1)}
                      accessibilityLabel={t("modifierGroups.moveDown")}
                    />
                    <IconButton
                      icon="trash"
                      size={18}
                      onPress={() =>
                        setOptions((current) =>
                          current.filter((entry) => entry.key !== option.key),
                        )
                      }
                      accessibilityLabel={t("modifierGroups.removeOption")}
                    />
                  </ThemedView>
                </ThemedView>
              </Card>
            ))}
            <Button
              variant="outline"
              leftIcon="plus"
              label={t("modifierGroups.addOption")}
              onPress={() => setOptions((current) => [...current, newOption()])}
            />
          </ThemedView>

          {group && (
            <ThemedView style={tw`gap-2`}>
              <ThemedText style={{ fontFamily: typography.bold }}>
                {t("modifierGroups.usedIn")}
              </ThemedText>
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {usedIn.length
                  ? usedIn.join(", ")
                  : t("modifierGroups.notUsed")}
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>

        {canManage && (
          <ThemedView style={tw`px-4 pt-2 pb-4 gap-2`}>
            {problem && (
              <ThemedText type="small" style={tw`text-gray-600 text-center`}>
                {problem}
              </ThemedText>
            )}
            <Button
              label={t("modifierGroups.save")}
              onPress={handleSave}
              loading={saveGroup.isPending}
              disabled={!!problem || saveGroup.isPending}
            />
          </ThemedView>
        )}

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
            options.find((option) => option.key === pickingFor)
              ?.inventoryItemId ?? ""
          }
          onChange={(value) => {
            if (!pickingFor) return;
            updateOption(pickingFor, {
              inventoryItemId: value ? String(value) : null,
            });
          }}
        />

        <DialogModal
          visible={showDelete}
          title={t("modifierGroups.deleteTitle")}
          message={t("modifierGroups.deleteMessage", {
            count: group?.productIds?.length ?? 0,
          })}
          confirmLabel={t("modifierGroups.delete")}
          confirmVariant="destructive"
          cancelLabel={t("common:actions.cancel")}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleteGroup.isPending}
        />
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}

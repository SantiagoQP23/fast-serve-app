import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, View } from "react-native";
import {
  BottomSheetFlatList,
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import Checkbox from "@/presentation/theme/components/checkbox";
import Icon from "@/presentation/theme/components/icon";
import type { Product } from "@/core/menu/models/product.model";

export type GroupProductsSheetRef = {
  present: (productIds: string[]) => void;
  dismiss: () => void;
};

type Row =
  | { kind: "category"; key: string; name: string; productIds: string[] }
  | { kind: "product"; key: string; product: Product };

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Picks the products that use a group (plans/vincular-desde-grupo.md): the
 * menu's products by category, with search and "select all" per category.
 * The choice stays on the group screen until it saves.
 */
const GroupProductsSheet = forwardRef<
  GroupProductsSheetRef,
  { products: Product[]; onSubmit: (productIds: string[]) => void }
>(({ products, onSubmit }, ref) => {
  const { t } = useTranslation(["menuManagement", "common"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useImperativeHandle(ref, () => ({
    present: (productIds) => {
      setSelected(new Set(productIds));
      setSearch("");
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const rows = useMemo<Row[]>(() => {
    const query = normalize(search.trim());
    const matching = products
      .filter((product) => !query || normalize(product.name).includes(query))
      .sort(
        (a, b) =>
          (a.category?.name ?? "").localeCompare(b.category?.name ?? "") ||
          a.name.localeCompare(b.name),
      );
    const result: Row[] = [];
    let current: Extract<Row, { kind: "category" }> | null = null;
    for (const product of matching) {
      const categoryId = product.category?.id ?? "";
      if (!current || current.key !== `category-${categoryId}`) {
        current = {
          kind: "category",
          key: `category-${categoryId}`,
          name:
            product.category?.name ?? t("modifierGroups.products.noCategory"),
          productIds: [],
        };
        result.push(current);
      }
      current.productIds.push(product.id);
      result.push({ kind: "product", key: product.id, product });
    }
    return result;
  }, [products, search, t]);

  const toggle = (ids: string[], value: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      ids.forEach((id) => (value ? next.add(id) : next.delete(id)));
      return next;
    });

  const handleDone = () => {
    onSubmit([...selected]);
    sheetRef.current?.dismiss();
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-3`}>
        <ThemedText type="h3">{t("modifierGroups.products.pick")}</ThemedText>
        <TextInput
          bottomSheet
          icon="search"
          placeholder={t("modifierGroups.products.search")}
          value={search}
          onChangeText={setSearch}
          trailingIcon={
            search.length > 0 ? (
              <Pressable
                onPress={() => setSearch("")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("common:actions.clear")}
              >
                <Icon name="circle-x" size={20} color={tw.color("gray-400")} />
              </Pressable>
            ) : null
          }
        />

        <View style={tw`max-h-[55vh]`}>
          {rows.length === 0 ? (
            <ThemedText type="body2" style={tw`text-gray-500 text-center py-8`}>
              {t("modifierGroups.products.noResults")}
            </ThemedText>
          ) : (
            <BottomSheetFlatList
              data={rows}
              keyExtractor={(row: Row) => row.key}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({
                item: row,
                index,
              }: {
                item: Row;
                index: number;
              }) => {
                if (row.kind === "category") {
                  const all = row.productIds.every((id) => selected.has(id));
                  return (
                    <ThemedView
                      style={tw.style(
                        "flex-row items-center gap-2 bg-transparent",
                        index > 0 && "pt-3",
                      )}
                    >
                      <ThemedText
                        type="small"
                        style={[
                          tw`flex-1 text-gray-500`,
                          { fontFamily: typography.semibold },
                        ]}
                        numberOfLines={1}
                      >
                        {row.name}
                      </ThemedText>
                      <Button
                        variant="text"
                        size="extra-small"
                        label={
                          all
                            ? t("modifierGroups.products.unselectAll")
                            : t("modifierGroups.products.selectAll")
                        }
                        onPress={() => toggle(row.productIds, !all)}
                      />
                    </ThemedView>
                  );
                }
                const { product } = row;
                return (
                  <ThemedView style={tw`py-1 bg-transparent`}>
                    <Checkbox
                      labelType="body1"
                      label={product.name}
                      value={selected.has(product.id)}
                      onValueChange={(value) => toggle([product.id], value)}
                      trailing={
                        !product.isActive ? (
                          <ThemedText type="small" style={tw`text-gray-500`}>
                            {t("modifierGroups.inactive")}
                          </ThemedText>
                        ) : undefined
                      }
                    />
                  </ThemedView>
                );
              }}
            />
          )}
        </View>

        <Button
          label={t("modifierGroups.products.done", { count: selected.size })}
          onPress={handleDone}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

GroupProductsSheet.displayName = "GroupProductsSheet";

export default GroupProductsSheet;

import { useRef, useState } from "react";
import { Pressable } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Chip from "@/presentation/theme/components/chip";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { Product } from "@/core/menu/models/product.model";
import { getSelectableTags } from "@/core/menu/models/tag.model";
import { useTags } from "@/presentation/menu-management/hooks/useTags";

interface ProductTagsSectionProps {
  product: Product;
  canManage: boolean;
}

/**
 * The "Etiquetas" of a product in menu management: the tags the waiter can
 * pick when ordering it. Managers remove them from the chips and add
 * existing or new ones from a sheet.
 */
export default function ProductTagsSection({
  product,
  canManage,
}: ProductTagsSectionProps) {
  const { t } = useTranslation("menuManagement");
  const {
    tags: allTags,
    tagsQuery,
    createTag,
    setProductTags,
  } = useTags({
    enabled: canManage,
  });
  const sheetRef = useRef<BottomSheetMethods>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");

  const productTags = getSelectableTags(product.tags);

  if (!canManage && productTags.length === 0) return null;

  const openSheet = () => {
    setSelectedIds(new Set(productTags.map((tag) => tag.id)));
    setNewName("");
    tagsQuery.refetch();
    sheetRef.current?.present();
  };

  const toggle = (tagId: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });

  const trimmedName = newName.trim();
  const existingWithName = allTags.find(
    (tag) => tag.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
  );

  const handleCreate = async () => {
    if (existingWithName) {
      setSelectedIds((current) => new Set(current).add(existingWithName.id));
      setNewName("");
      return;
    }
    const tag = await createTag.mutateAsync(trimmedName);
    setSelectedIds((current) => new Set(current).add(tag.id));
    setNewName("");
  };

  const handleSave = async () => {
    await setProductTags.mutateAsync({
      productId: product.id,
      tagIds: [...selectedIds],
    });
    sheetRef.current?.dismiss();
  };

  const handleRemove = (tagId: string) =>
    setProductTags.mutate({
      productId: product.id,
      tagIds: productTags.map((tag) => tag.id).filter((id) => id !== tagId),
    });

  return (
    <ThemedView style={tw`gap-3 mt-4`}>
      <ThemedView style={tw`gap-1 bg-transparent`}>
        <ThemedText type="caption">{t("tags.title")}</ThemedText>
        {canManage && (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("tags.productHint")}
          </ThemedText>
        )}
      </ThemedView>

      {productTags.length > 0 && (
        <ThemedView style={tw`flex-row flex-wrap gap-2 bg-transparent`}>
          {productTags.map((tag) => (
            <Chip
              key={tag.id}
              variant="input"
              label={tag.name}
              disabled={setProductTags.isPending}
              onRemove={canManage ? () => handleRemove(tag.id) : undefined}
            />
          ))}
        </ThemedView>
      )}

      {canManage && (
        <Pressable
          onPress={openSheet}
          style={({ pressed }) => tw.style("py-3", pressed && "opacity-60")}
        >
          <ThemedText type="body1" style={tw`text-gray-400`}>
            {t("tags.addToProduct")}
          </ThemedText>
        </Pressable>
      )}

      <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedView style={tw`gap-1 bg-transparent`}>
            <ThemedText type="h3">{t("tags.productSheetTitle")}</ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {product.name}
            </ThemedText>
          </ThemedView>

          {allTags.length > 0 ? (
            <ThemedView style={tw`flex-row flex-wrap gap-2 bg-transparent`}>
              {allTags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  selected={selectedIds.has(tag.id)}
                  onPress={() => toggle(tag.id)}
                />
              ))}
            </ThemedView>
          ) : (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {tagsQuery.isLoading ? t("loading") : t("tags.emptyInSheet")}
            </ThemedText>
          )}

          <TextInput
            bottomSheet
            variant="outlined"
            label={t("tags.newTag")}
            placeholder={t("tags.placeholders.name")}
            value={newName}
            onChangeText={setNewName}
            maxLength={50}
            returnKeyType="done"
            onSubmitEditing={() => trimmedName.length >= 2 && handleCreate()}
          />
          {trimmedName.length >= 2 && (
            <Button
              variant="outline"
              leftIcon="plus"
              label={
                existingWithName
                  ? t("tags.selectExisting", { name: existingWithName.name })
                  : t("tags.createNamed", { name: trimmedName })
              }
              onPress={handleCreate}
              loading={createTag.isPending}
              disabled={createTag.isPending}
            />
          )}

          <Button
            label={t("tags.save")}
            onPress={handleSave}
            loading={setProductTags.isPending}
            disabled={setProductTags.isPending}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </ThemedView>
  );
}

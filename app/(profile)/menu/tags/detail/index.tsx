import { useMemo, useRef, useState } from "react";
import { ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import TagNameSheet from "@/presentation/menu-management/components/tag-name-sheet";
import { useTags } from "@/presentation/menu-management/hooks/useTags";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";

export default function MenuTagDetailScreen() {
  const { t } = useTranslation("menuManagement");
  const { tagId } = useLocalSearchParams<{ tagId: string }>();
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { tags, tagsQuery, renameTag, deleteTag, setTagProducts } = useTags();
  const { products: menuProducts } = useMenu();
  const renameSheetRef = useRef<BottomSheetMethods>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const tag = tags.find((current) => current.id === tagId);

  const products = useMemo(() => {
    const ids = new Set(tag?.productIds ?? []);
    return menuProducts
      .filter((product) => ids.has(product.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [menuProducts, tag]);

  const handleUnlink = (productId: string) => {
    if (!tag) return;
    setTagProducts.mutate({
      id: tag.id,
      productIds: tag.productIds.filter((id) => id !== productId),
    });
  };

  const handleConfirmDelete = async () => {
    if (!tag) return;
    await deleteTag.mutateAsync(tag.id);
    setDeleteVisible(false);
    router.back();
  };

  const header = (
    <ThemedView style={tw`items-center gap-3 flex-row mb-6 bg-transparent`}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t("common:actions.goBack")}
        style={({ pressed }) => tw.style(pressed && "opacity-70")}
      >
        <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
      </Pressable>
      <ThemedView style={tw`flex-1 bg-transparent`} />
      {tag && canManage && (
        <>
          <IconButton
            icon="square-pen"
            onPress={() => renameSheetRef.current?.present()}
            accessibilityLabel={t("tags.rename")}
          />
          <IconButton
            icon="trash"
            onPress={() => setDeleteVisible(true)}
            accessibilityLabel={t("tags.delete")}
          />
        </>
      )}
    </ThemedView>
  );

  if (!tag) {
    return (
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        {header}
        <ThemedView style={tw`items-center py-8 gap-3`}>
          {tagsQuery.isLoading ? (
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          ) : (
            <>
              <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
              <ThemedText type="body1" style={tw`text-gray-500`}>
                {t("tags.notFound")}
              </ThemedText>
            </>
          )}
        </ThemedView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      {header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
      >
        <ThemedView style={tw`gap-1`}>
          <ThemedText type="h1">{tag.name}</ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("tags.productCount", { count: tag.productIds.length })}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`gap-2 mt-2`}>
          <ThemedText type="caption">{t("tags.linkedProducts")}</ThemedText>

          {products.length === 0 ? (
            <ThemedView
              style={tw`items-center py-6 gap-2 bg-gray-50 rounded-3xl px-4`}
            >
              <Icon name="hamburger" size={28} color={tw.color("gray-400")} />
              <ThemedText type="body2" style={tw`text-center text-gray-500`}>
                {t("tags.noLinkedProducts")}
              </ThemedText>
            </ThemedView>
          ) : (
            products.map((product) => (
              <ThemedView
                key={product.id}
                style={tw.style(
                  "flex-row items-center gap-3 py-3 bg-transparent",
                  !product.isActive && "opacity-50",
                )}
              >
                <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.semibold }}
                    numberOfLines={1}
                  >
                    {product.name}
                  </ThemedText>
                  {product.category?.name ? (
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {product.category.name}
                    </ThemedText>
                  ) : null}
                </ThemedView>
                {canManage && (
                  <IconButton
                    icon="x"
                    onPress={() => handleUnlink(product.id)}
                    disabled={setTagProducts.isPending}
                    accessibilityLabel={t("tags.unlinkProduct", {
                      name: product.name,
                    })}
                  />
                )}
              </ThemedView>
            ))
          )}
        </ThemedView>

        {canManage && (
          <Button
            label={t("tags.linkProducts")}
            leftIcon="plus"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: "/(profile)/menu/tags/products",
                params: { tagId: tag.id },
              })
            }
          />
        )}
      </ScrollView>

      <TagNameSheet
        key={tag.name}
        sheetRef={renameSheetRef}
        title={t("tags.rename")}
        submitLabel={t("tags.save")}
        initialName={tag.name}
        loading={renameTag.isPending}
        onSubmit={(name) => renameTag.mutateAsync({ id: tag.id, name })}
      />

      <DialogModal
        visible={deleteVisible}
        title={t("tags.deleteTitle")}
        message={t("tags.deleteMessage", { name: tag.name })}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteTag.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </ScreenLayout>
  );
}

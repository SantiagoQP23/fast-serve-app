import { useEffect, useRef, useState } from "react";
import { ScrollView, RefreshControl, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import SwipeableRow from "@/presentation/theme/components/swipeable-row";
import Popover, {
  AnchorPosition,
} from "@/presentation/theme/components/popover";
import type { Category } from "@/core/menu/models/category.model";

export default function MenuSectionCategoriesScreen() {
  const { t } = useTranslation("menuManagement");
  const params = useLocalSearchParams<{
    sectionId: string;
    name?: string;
    isActive?: string;
    isPublic?: string;
  }>();
  const { sections, categories, products, menuQuery } = useMenu();
  const { isLoading, isError, refetch, isRefetching } = menuQuery;
  const { deleteCategory, updateSection, deleteSection } =
    useMenuManagement();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const [sectionDeleteVisible, setSectionDeleteVisible] = useState(false);
  const [sectionMenuVisible, setSectionMenuVisible] = useState(false);
  const [sectionMenuAnchor, setSectionMenuAnchor] =
    useState<AnchorPosition | null>(null);
  const sectionMenuButtonRef = useRef<View>(null);

  // Route params are a snapshot from when this screen was pushed and go
  // stale after editing the section elsewhere, so prefer the live section
  // from the store and fall back to params only until it loads.
  const currentSection = sections.find((s) => s.id === params.sectionId);
  const sectionName = currentSection?.name ?? params.name;
  const sectionIsActive = currentSection
    ? String(currentSection.isActive)
    : params.isActive;
  const sectionIsPublic = currentSection
    ? String(currentSection.isPublic)
    : params.isPublic;

  const sectionCategories = categories.filter(
    (category) => category.section.id === params.sectionId,
  );

  useEffect(() => {
    if (categories.length === 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCategory = () => {
    router.push({
      pathname: "/(profile)/menu-category-form",
      params: { sectionId: params.sectionId },
    });
  };

  const handleEditCategory = (category: Category) => {
    router.push({
      pathname: "/(profile)/menu-category-form",
      params: {
        categoryId: category.id,
        name: category.name,
        sectionId: category.section.id,
        isActive: String(category.isActive),
        isPublic: String(category.isPublic),
      },
    });
  };

  const handleViewCategory = (category: Category) => {
    router.push({
      pathname: "/(profile)/menu-category-products",
      params: {
        categoryId: category.id,
        name: category.name,
        sectionId: category.section.id,
        isActive: String(category.isActive),
        isPublic: String(category.isPublic),
      },
    });
  };

  const handleEditSection = () => {
    router.push({
      pathname: "/(profile)/menu-section-form",
      params: {
        sectionId: params.sectionId,
        name: sectionName,
        isActive: sectionIsActive,
        isPublic: sectionIsPublic,
      },
    });
  };

  const handleOpenSectionMenu = () => {
    sectionMenuButtonRef.current?.measure(
      (_x, _y, width, height, pageX, pageY) => {
        setSectionMenuAnchor({ x: pageX, y: pageY, width, height });
        setSectionMenuVisible(true);
      },
    );
  };

  const handleToggleSectionActive = () => {
    if (!currentSection) return;
    updateSection.mutate({
      id: currentSection.id,
      isActive: !currentSection.isActive,
    });
  };

  const handleConfirmDeleteSection = async () => {
    if (!params.sectionId) return;
    await deleteSection.mutateAsync(params.sectionId);
    setSectionDeleteVisible(false);
    router.back();
  };

  const getProductCount = (categoryId: string) =>
    products.filter((product) => product.category.id === categoryId).length;

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    await deleteCategory.mutateAsync(categoryToDelete.id);
    setCategoryToDelete(null);
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center gap-2 flex-row justify-between mb-6`}>
        <ThemedView style={tw`items-center gap-4 flex-row flex-1`}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="arrow-back-outline" size={24} />
          </Pressable>
          <ThemedText
            type="h3"
            style={{ fontFamily: typography.regular }}
            numberOfLines={1}
          >
            {sectionName}
          </ThemedText>
        </ThemedView>
        {canManage && (
          <View ref={sectionMenuButtonRef} collapsable={false}>
            <IconButton
              icon="ellipsis-vertical"
              size={20}
              variant="text"
              onPress={handleOpenSectionMenu}
            />
          </View>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        {isLoading && categories.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="pricetag-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {isError && categories.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!isLoading && !isError && sectionCategories.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="pricetag-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("categories.noCategories")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("categories.noCategoriesDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {sectionCategories.length > 0 && (
          <ThemedView style={tw`gap-4`}>
            {sectionCategories.map((category) => (
              <SwipeableRow
                key={category.id}
                onEdit={canManage ? () => handleEditCategory(category) : undefined}
                onDelete={
                  canManage ? () => setCategoryToDelete(category) : undefined
                }
              >
                <Card
                  onPress={() => handleViewCategory(category)}
                  style={!category.isActive && tw`opacity-50`}
                >
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`gap-4 flex-1 flex-row items-center`}>
                      <Ionicons
                        name="pricetag-outline"
                        size={28}
                        color={tw.color("text-light-on-surface-variant")}
                      />
                      <ThemedView style={tw`flex-1 gap-2`}>
                        <ThemedText type="h4">{category.name}</ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {t("categories.productCount", {
                            count: getProductCount(category.id),
                          })}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                </Card>
              </SwipeableRow>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      {canManage && <Fab icon="add" onPress={handleCreateCategory} />}

      <Popover
        visible={sectionMenuVisible}
        onClose={() => setSectionMenuVisible(false)}
        anchor={sectionMenuAnchor}
        items={[
          {
            label: t("edit"),
            icon: "create-outline",
            onPress: handleEditSection,
          },
          {
            label: currentSection?.isActive
              ? t("deactivate")
              : t("activate"),
            icon: currentSection?.isActive
              ? "eye-off-outline"
              : "eye-outline",
            onPress: handleToggleSectionActive,
          },
          {
            label: t("delete"),
            icon: "trash-outline",
            onPress: () => setSectionDeleteVisible(true),
          },
        ]}
      />

      <DialogModal
        visible={sectionDeleteVisible}
        title={t("sections.deleteTitle")}
        message={t("sections.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteSection.isPending}
        onConfirm={handleConfirmDeleteSection}
        onCancel={() => setSectionDeleteVisible(false)}
      />

      <DialogModal
        visible={!!categoryToDelete}
        title={t("categories.deleteTitle")}
        message={t("categories.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteCategory.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </ScreenLayout>
  );
}

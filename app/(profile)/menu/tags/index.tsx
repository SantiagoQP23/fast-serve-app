import { useRef, useState } from "react";
import type { IFuseOptions } from "fuse.js";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Fab from "@/presentation/theme/components/fab";
import TextInput from "@/presentation/theme/components/text-input";
import TagNameSheet from "@/presentation/menu-management/components/tag-name-sheet";
import { useTags } from "@/presentation/menu-management/hooks/useTags";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useFuzzySearch } from "@/presentation/shared/hooks/useFuzzySearch";
import type { TagWithProducts } from "@/core/menu/models/tag.model";

const TAG_SEARCH_OPTIONS: IFuseOptions<TagWithProducts> = { keys: ["name"] };

export default function MenuTagsScreen() {
  const { t } = useTranslation("menuManagement");
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { tags, tagsQuery, createTag } = useTags();
  const [search, setSearch] = useState("");
  const createSheetRef = useRef<BottomSheetMethods>(null);

  const filteredTags = useFuzzySearch(tags, search, TAG_SEARCH_OPTIONS);

  const openTag = (tagId: string) =>
    router.push({
      pathname: "/(profile)/menu/tags/detail",
      params: { tagId },
    });

  const handleCreate = async (name: string) => {
    const tag = await createTag.mutateAsync(name);
    openTag(tag.id);
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <ThemedView style={tw`items-center gap-3 flex-row bg-transparent`}>
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
            {t("tags.title")}
          </ThemedText>
        </ThemedView>
        {tags.length > 0 && (
          <TextInput
            placeholder={t("tags.searchPlaceholder")}
            icon="search"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pb-28 pt-4`}
        refreshControl={
          <RefreshControl
            refreshing={tagsQuery.isFetching && !tagsQuery.isLoading}
            onRefresh={tagsQuery.refetch}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        {tagsQuery.isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {tagsQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("tags.loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => tagsQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!tagsQuery.isLoading && !tagsQuery.isError && tags.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="tag" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("tags.empty")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("tags.emptyDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {tags.length > 0 && filteredTags.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="search" size={40} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("tags.noResults")}
            </ThemedText>
          </ThemedView>
        )}

        {filteredTags.map((tag) => (
          <Pressable
            key={tag.id}
            onPress={() => openTag(tag.id)}
            accessibilityRole="button"
            style={({ pressed }) =>
              tw.style(
                "flex-row items-center gap-4 py-3",
                pressed && "opacity-70",
              )
            }
          >
            <ThemedText
              style={[tw`flex-1`, { fontFamily: typography.medium }]}
              numberOfLines={1}
            >
              {tag.name}
            </ThemedText>
            <Icon name="chevron-right" size={20} color={tw.color("gray-400")} />
          </Pressable>
        ))}
      </ScrollView>

      {canManage && (
        <Fab
          icon="plus"
          label={t("tags.newTag")}
          onPress={() => createSheetRef.current?.present()}
        />
      )}

      <TagNameSheet
        sheetRef={createSheetRef}
        title={t("tags.newTag")}
        submitLabel={t("tags.create")}
        loading={createTag.isPending}
        onSubmit={handleCreate}
      />
    </ScreenLayout>
  );
}

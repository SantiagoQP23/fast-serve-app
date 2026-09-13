import { useEffect } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import type { Section } from "@/core/menu/models/section.model";

export default function MenuSectionsScreen() {
  const { t } = useTranslation("menuManagement");
  const { sections, categories, menuQuery } = useMenu();
  const { isLoading, isError, refetch, isRefetching } = menuQuery;

  useEffect(() => {
    if (sections.length === 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSection = () => {
    router.push("/(profile)/menu-section-form");
  };

  const handleEditSection = (section: Section) => {
    router.push({
      pathname: "/(profile)/menu-section-form",
      params: {
        sectionId: section.id,
        name: section.name,
        isActive: String(section.isActive),
        isPublic: String(section.isPublic),
      },
    });
  };

  const getCategoryCount = (sectionId: string) =>
    categories.filter((category) => category.section.id === sectionId)
      .length;

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
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
        {isLoading && sections.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="list-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {isError && sections.length === 0 && (
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

        {!isLoading && !isError && sections.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="list-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("sections.noSections")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("sections.noSectionsDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {sections.length > 0 && (
          <ThemedView style={tw`gap-4`}>
            {sections
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <Card key={section.id} onPress={() => handleEditSection(section)}>
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`gap-4 flex-1 flex-row items-center`}>
                      <Ionicons
                        name="list-outline"
                        size={28}
                        color={tw.color("text-light-on-surface-variant")}
                      />
                      <ThemedView style={tw`flex-1 gap-2`}>
                        <ThemedText type="h4">{section.name}</ThemedText>
                        <ThemedView style={tw`flex-row items-center gap-2`}>
                          <ThemedText type="small" style={tw`text-gray-500`}>
                            {t("sections.categoryCount", {
                              count: getCategoryCount(section.id),
                            })}
                          </ThemedText>
                          {!section.isActive && (
                            <Label
                              text={t("inactive")}
                              color="error"
                              size="small"
                            />
                          )}
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>
                    <IconButton
                      icon="create-outline"
                      size={20}
                      variant="text"
                      onPress={() => handleEditSection(section)}
                    />
                  </ThemedView>
                </Card>
              ))}
          </ThemedView>
        )}
      </ScrollView>

      <Fab icon="add" onPress={handleCreateSection} />
    </ScreenLayout>
  );
}

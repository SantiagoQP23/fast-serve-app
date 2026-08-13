import { ScrollView, RefreshControl } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";

export default function ProductionAreasScreen() {
  const { t } = useTranslation("auth");
  const { getAllQuery, productionAreas } = useProductionAreas();
  const { isLoading, isError, refetch, isRefetching } = getAllQuery;

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
        {/* Header */}
        <ThemedView style={tw`flex-row items-center gap-2 justify-center py-4`}>
          <Ionicons name="cube-outline" size={24} />
          <ThemedText type="h2">{t("manage.productionAreas")}</ThemedText>
        </ThemedView>

        {isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="cube-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              Loading production areas...
            </ThemedText>
          </ThemedView>
        )}

        {isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              Failed to load production areas
            </ThemedText>
            <Button label="Retry" onPress={() => refetch()} variant="outline" />
          </ThemedView>
        )}

        {!isLoading && !isError && productionAreas.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="cube-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              No production areas found
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              There are no production areas configured for this restaurant.
            </ThemedText>
          </ThemedView>
        )}

        {!isLoading && !isError && productionAreas.length > 0 && (
          <ThemedView style={tw`gap-4`}>
            {productionAreas.map((area) => (
              <Card key={area.id}>
                <ThemedView style={tw`gap-4`}>
                  {/* Area Name & Status */}
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`flex-row items-center gap-3 flex-1`}>
                      <Ionicons
                        name="cube-outline"
                        size={24}
                        color={
                          area.isActive
                            ? tw.color("green-500")
                            : tw.color("gray-400")
                        }
                      />
                      <ThemedView style={tw`flex-1`}>
                        <ThemedText type="h4" style={tw`font-semibold`}>
                          {area.name}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          style={tw`${
                            area.isActive
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        >
                          {area.isActive ? "Active" : "Inactive"}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>

                  {/* Divider */}
                  <ThemedView style={tw`h-px bg-gray-200 dark:bg-gray-700`} />

                  {/* Area Details */}
                  <ThemedView style={tw`gap-2`}>
                    {area.description && (
                      <ThemedView style={tw`flex-row items-center gap-2`}>
                        <Ionicons
                          name="document-text-outline"
                          size={16}
                          color="#999"
                        />
                        <ThemedText type="body2" style={tw`text-gray-500`}>
                          {area.description}
                        </ThemedText>
                      </ThemedView>
                    )}

                    <ThemedView style={tw`flex-row items-center gap-2`}>
                      <Ionicons
                        name="print-outline"
                        size={16}
                        color="#999"
                      />
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {area.printers?.length || 0} printer
                        {(area.printers?.length || 0) !== 1 ? "s" : ""}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

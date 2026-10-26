import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Icon from "@/presentation/theme/components/icon";
import IconButton from "@/presentation/theme/components/icon-button";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import {
  useVariantStockSection,
  VariantAdjustButtons,
  VariantStockDetails,
  VariantStockMovements,
  VariantStockOverlays,
  VariantStockOverview,
} from "@/presentation/menu-management/components/variant-stock-section";

interface VariantDetailViewProps {
  productOptionId: number;
  /** Rendered as a pane (tablet): close button instead of back. */
  embedded?: boolean;
  onClose?: () => void;
}

/**
 * One menu variant and its stock: its own units (with movements and
 * restock / decrease, like an inventory item), or what its recipe covers
 * and each insumo's stock, or that it isn't tracked.
 */
export default function VariantDetailView({
  productOptionId,
  embedded = false,
  onClose,
}: VariantDetailViewProps) {
  const { t } = useTranslation("inventory");
  const insets = useSafeAreaInsets();
  const products = useMenuStore((state) => state.products);

  const product = products.find((p) =>
    p.options?.some((option) => option.id === productOptionId),
  );
  const option = product?.options.find((o) => o.id === productOptionId);
  const [section, sectionSheets] = useVariantStockSection(product, option);

  const Container = embedded ? ThemedView : ScreenLayout;
  const close = onClose ?? (() => router.back());

  if (!product || !option) {
    return (
      <Container style={tw`flex-1 px-4 pt-8 bg-background`}>
        <InventoryScreenHeader
          onBack={close}
          backIcon={embedded ? "x" : "arrow-left"}
        />
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Icon name="circle-alert" size={48} color={tw.color("gray-400")} />
          <ThemedText type="body1" style={tw`text-gray-500 text-center`}>
            {t("variant.notFound")}
          </ThemedText>
        </ThemedView>
      </Container>
    );
  }

  return (
    <Container style={tw`flex-1 bg-background`}>
      <ThemedView style={tw`px-4 ${embedded ? "pt-2" : "pt-6"} bg-transparent`}>
        <InventoryScreenHeader
          onBack={close}
          backIcon={embedded ? "x" : "arrow-left"}
          right={
            section.hasOptions ? (
              <IconButton
                icon="ellipsis-vertical"
                onPress={section.openOptions}
                accessibilityLabel={t("options")}
                style={tw`-mr-3`}
              />
            ) : undefined
          }
        />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-8 pt-6 pb-10`}
        refreshControl={
          section.ownItemId ? (
            <RefreshControl
              refreshing={section.refreshing}
              onRefresh={section.onRefresh}
              tintColor={tw.color("primary")}
              colors={[tw.color("primary") as string]}
            />
          ) : undefined
        }
      >
        <VariantStockOverview section={section} title={section.title} />
        <VariantStockDetails section={section} />
        <VariantStockMovements section={section} />
      </ScrollView>

      {section.mode === "own" && section.ownItem && (
        <ThemedView
          style={[
            tw`px-4 pt-3 border-t border-divider bg-background`,
            { paddingBottom: embedded ? 16 : Math.max(insets.bottom, 16) },
          ]}
        >
          <VariantAdjustButtons section={section} />
        </ThemedView>
      )}

      <VariantStockOverlays section={section} sheets={sectionSheets} />
    </Container>
  );
}

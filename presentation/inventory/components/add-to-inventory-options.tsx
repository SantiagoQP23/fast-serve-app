import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Card from "@/presentation/theme/components/card";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";

interface AddToInventoryOptionsProps {
  onTrackMenuProduct: () => void;
  onCreateItem: () => void;
}

export default function AddToInventoryOptions({
  onTrackMenuProduct,
  onCreateItem,
}: AddToInventoryOptionsProps) {
  const { t } = useTranslation("inventory");
  const menuProducts = useMenuStore((state) => state.products);
  const exampleMenuProductName =
    menuProducts.find((product) => product.isActive)?.name ||
    t("addToInventory.menuProductExampleFallback");

  return (
    <ThemedView style={tw`gap-3 mt-4`}>
      <ThemedText type="caption" style={tw`text-gray-500 font-semibold`}>
        {t("addToInventory.title")}
      </ThemedText>
      <Card onPress={onTrackMenuProduct}>
        <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
          <Ionicons
            name="fast-food-outline"
            size={26}
            color={tw.color("text-light-on-surface-variant")}
          />
          <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
            <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
              {t("addToInventory.menuProduct")}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("addToInventory.menuProductDescription", {
                product: exampleMenuProductName,
              })}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </Card>

      <Card onPress={onCreateItem}>
        <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
          <Ionicons
            name="cube-outline"
            size={26}
            color={tw.color("text-light-on-surface-variant")}
          />
          <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
            <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
              {t("addToInventory.inventoryItem")}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("addToInventory.inventoryItemDescription")}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </Card>
    </ThemedView>
  );
}

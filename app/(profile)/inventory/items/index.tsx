import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import InventoryItemsContent from "@/presentation/inventory/components/inventory-items-content";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

/** The Insumos page, opened from the Productos hub. */
export default function MenuInventoryItemsScreen() {
  // Expanded: InventoryItemsContent lays out its own list + detail panes
  const { isExpanded } = useResponsiveLayout();

  return (
    <ScreenLayout fullWidth={isExpanded} style={tw`flex-1`}>
      <InventoryItemsContent />
    </ScreenLayout>
  );
}

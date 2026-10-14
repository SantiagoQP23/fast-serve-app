import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import InventoryContent from "@/presentation/inventory/components/inventory-content";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

export default function InventoryScreen() {
  // Expanded: InventoryContent lays out its own list + detail panes
  const { isExpanded } = useResponsiveLayout();

  return (
    <ScreenLayout fullWidth={isExpanded} style={tw`flex-1`}>
      <InventoryContent />
    </ScreenLayout>
  );
}

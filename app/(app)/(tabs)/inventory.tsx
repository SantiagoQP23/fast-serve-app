import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import InventoryContent from "@/presentation/inventory/components/inventory-content";

export default function InventoryScreen() {
  return (
    <ScreenLayout style={tw`flex-1`}>
      <InventoryContent />
    </ScreenLayout>
  );
}

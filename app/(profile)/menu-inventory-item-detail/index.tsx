import { useLocalSearchParams } from "expo-router";
import InventoryItemDetailView from "@/presentation/inventory/components/inventory-item-detail-view";

export default function MenuInventoryItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  return <InventoryItemDetailView itemId={itemId} />;
}

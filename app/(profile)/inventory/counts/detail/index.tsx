import { useLocalSearchParams } from "expo-router";
import InventoryCountDetailView from "@/presentation/inventory/components/inventory-count-detail-view";

export default function MenuInventoryCountDetailScreen() {
  const { countId } = useLocalSearchParams<{ countId: string }>();
  return <InventoryCountDetailView countId={countId} />;
}

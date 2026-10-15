import { useLocalSearchParams } from "expo-router";
import InventoryPurchaseDetailView from "@/presentation/inventory/components/inventory-purchase-detail-view";

export default function MenuInventoryPurchaseDetailScreen() {
  const { purchaseId } = useLocalSearchParams<{ purchaseId: string }>();
  return <InventoryPurchaseDetailView purchaseId={purchaseId} />;
}

import { useLocalSearchParams } from "expo-router";
import PurchaseCartPanel from "@/presentation/inventory/components/purchase-cart-panel";

export default function MenuInventoryPurchaseCartScreen() {
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  return <PurchaseCartPanel draftId={draftId} />;
}

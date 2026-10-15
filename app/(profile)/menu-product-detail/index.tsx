import { useLocalSearchParams } from "expo-router";
import MenuProductDetailView from "@/presentation/menu-management/components/menu-product-detail-view";

export default function MenuProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  return <MenuProductDetailView productId={productId} />;
}

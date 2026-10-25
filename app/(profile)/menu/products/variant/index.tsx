import { useLocalSearchParams } from "expo-router";
import VariantDetailView from "@/presentation/menu-management/components/variant-detail-view";

export default function VariantDetailScreen() {
  const { productOptionId } = useLocalSearchParams<{
    productOptionId: string;
  }>();
  return <VariantDetailView productOptionId={Number(productOptionId)} />;
}

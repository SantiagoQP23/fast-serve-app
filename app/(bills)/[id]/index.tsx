import { useLocalSearchParams } from "expo-router";
import BillDetailView from "@/presentation/orders/components/bill-detail-view";

export default function BillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BillDetailView billId={Number(id)} />;
}

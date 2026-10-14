import { useLocalSearchParams } from "expo-router";
import TransactionDetailView from "@/presentation/transactions/components/transaction-detail-view";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransactionDetailView transactionId={Number(id)} />;
}

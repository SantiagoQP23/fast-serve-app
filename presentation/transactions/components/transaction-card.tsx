import React from "react";
import { Pressable, PressableProps } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { Transaction } from "@/core/transactions/models/transaction.model";
import { TransactionType } from "@/core/transactions/models/transaction-category.model";
import { formatCurrency, getRelativeTime } from "@/core/i18n/utils";

interface TransactionCardProps extends PressableProps {
  transaction: Transaction;
}

export default function TransactionCard({
  transaction,
  onPress,
  ...rest
}: TransactionCardProps) {
  const isIncome =
    transaction.category.transactionType === TransactionType.INCOME;
  const relativeTime = getRelativeTime(transaction.createdAt);

  // Use the category color for the icon circle background, with low opacity
  const categoryColor = transaction.category.color ?? "#6b7280";

  return (
    <Pressable onPress={onPress} {...rest}>
      <ThemedView
        style={tw`flex-row items-center justify-between py-3 border-b border-gray-100`}
      >
        {/* Left: Colored icon circle + transaction info */}
        <ThemedView style={tw`flex-row items-center gap-3 flex-1`}>
          {/* Category color circle */}
          <ThemedView
            style={[
              tw`w-10 h-10 rounded-full items-center justify-center`,
              { backgroundColor: `${categoryColor}1A` },
            ]}
          >
            <Ionicons name="receipt-outline" size={20} color={categoryColor} />
          </ThemedView>

          {/* Transaction details */}
          <ThemedView style={tw`flex-1 gap-0.5`}>
            <ThemedText
              type="body1"
              style={tw`font-semibold`}
              numberOfLines={1}
            >
              {transaction.name}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-800`}>
              {transaction.account.name}
            </ThemedText>
            <ThemedView style={tw`flex-row items-center gap-1.5`}>
              <ThemedText
                type="small"
                style={tw`text-gray-400`}
                numberOfLines={1}
              >
                {transaction.createdBy.person.firstName}{" "}
                {transaction.createdBy.person.lastName}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Right: Amount colored by transaction type */}
        <ThemedView style={tw`items-end pl-2`}>
          <ThemedText
            type="body1"
            style={tw`font-semibold ${isIncome ? "text-green-700" : "text-red-600"}`}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </ThemedText>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {relativeTime}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

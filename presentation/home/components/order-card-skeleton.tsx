import React from "react";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Skeleton from "@/presentation/theme/components/skeleton";
import tw from "@/presentation/theme/lib/tailwind";

export default function OrderCardSkeleton() {
  return (
    <ThemedView style={tw`mb-3 rounded-2xl`}>
      <ThemedView style={tw`p-4 rounded-3xl border border-light-border bg-white dark:bg-gray-800`}>
        <ThemedView style={tw`gap-4 bg-transparent`}>
          {/* Header: status + time */}
          <ThemedView style={tw`flex-row justify-between items-center bg-transparent`}>
            <ThemedView style={tw`flex-row items-center bg-transparent gap-2`}>
              <Skeleton style={tw`h-6 w-20 rounded-full`} />
            </ThemedView>
            <ThemedView style={tw`flex-row items-center bg-transparent gap-2`}>
              <Skeleton style={tw`h-4 w-12 rounded-md`} />
            </ThemedView>
          </ThemedView>

          {/* Title */}
          <ThemedView style={tw`gap-2 bg-transparent`}>
            <Skeleton style={tw`h-6 w-48 rounded-md`} />
            {/* Meta row */}
            <Skeleton style={tw`h-4 w-36 rounded-md`} />
          </ThemedView>

          {/* Progress bar placeholder */}
          <ThemedView style={tw`gap-2 bg-transparent`}>
            <ThemedView style={tw`flex-row justify-between items-center bg-transparent`}>
              <Skeleton style={tw`h-3 w-24 rounded-md`} />
              <Skeleton style={tw`h-3 w-8 rounded-md`} />
            </ThemedView>
            <Skeleton style={tw`h-1.5 w-full rounded-full`} />
          </ThemedView>

          {/* Bottom metrics */}
          <ThemedView style={tw`flex-row items-center bg-transparent justify-between`}>
            <ThemedView style={tw`flex-row items-center bg-transparent gap-3`}>
              <Skeleton style={tw`h-4 w-20 rounded-md`} />
              <Skeleton style={tw`h-4 w-16 rounded-md`} />
            </ThemedView>
            <Skeleton style={tw`h-6 w-16 rounded-md`} />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

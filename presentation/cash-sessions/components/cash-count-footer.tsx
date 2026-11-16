import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { CashCountState } from "../hooks/useCashCount";
import { CashCountTotal } from "./cash-counter";

interface CashCountFooterProps {
  count: CashCountState;
  /** The confirm button(s). */
  children: ReactNode;
}

/**
 * Bottom bar of the open/close screens, outside the scroll: the count's
 * total (when counting bill by bill) above the confirm button.
 */
export default function CashCountFooter({
  count,
  children,
}: CashCountFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView
      style={[
        tw`border-t border-divider px-4 pt-3 gap-3`,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      {count.mode === "count" && <CashCountTotal total={count.total} />}
      {children}
    </ThemedView>
  );
}

import type { IconName } from "@/presentation/theme/components/icon";
import tw from "@/presentation/theme/lib/tailwind";
import { InventoryCountItemStatus } from "@/core/inventory/models/inventory-count.model";

/** Leading icon, and its tint, that marks a count line's status on cards and rows. */
export function getCountStatusIcon(status: InventoryCountItemStatus): {
  icon: IconName;
  iconColor?: string;
} {
  switch (status) {
    case InventoryCountItemStatus.ADJUSTED:
      return { icon: "pencil", iconColor: tw.color("orange-500") };
    case InventoryCountItemStatus.MATCHED:
      return { icon: "circle-check", iconColor: tw.color("emerald-600") };
    case InventoryCountItemStatus.SKIPPED:
      return { icon: "circle-minus" };
    default:
      return { icon: "circle" };
  }
}

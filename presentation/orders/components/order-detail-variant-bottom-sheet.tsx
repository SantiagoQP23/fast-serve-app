import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Card from "@/presentation/theme/components/card";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import {
  ProductOption,
  getProductOptionAvailableQuantity,
} from "@/core/menu/models/product-optionl.model";
import {
  OrderDetail,
  getReplaceBlockReason,
} from "@/core/orders/models/order-detail.model";

interface OrderDetailVariantBottomSheetProps {
  detail: OrderDetail;
  options: ProductOption[];
  selectedOptionId?: number;
  onSelectOption: (option: ProductOption) => void;
  onReplace?: () => void;
  onClose?: () => void;
}

const OrderDetailVariantBottomSheet = ({
  detail,
  options,
  selectedOptionId,
  onSelectOption,
  onReplace,
  onClose,
}: OrderDetailVariantBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders", "menu", "inventory"]);

  const handleSelectOption = (option: ProductOption) => {
    onClose?.();
    onSelectOption(option);
  };

  const replaceBlockReason = getReplaceBlockReason(detail);

  const handleReplace = () => {
    if (replaceBlockReason) return;
    onClose?.();
    onReplace?.();
  };

  const showReplace = !!onReplace;

  return (
    <BottomSheetView style={tw`px-4 pb-6 gap-4`}>
      {options.length > 1 && (
        <ThemedView style={tw`gap-2`}>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("menu:variants")}
          </ThemedText>
          <ThemedView style={tw`flex-row flex-wrap gap-3`}>
            {options.map((option) => {
              const isSelected = option.id === selectedOptionId;
              return (
                <Card
                  key={option.id}
                  onPress={() => handleSelectOption(option)}
                  variant="outline"
                  style={tw`min-w-36  gap-2 p-4   ${isSelected ? " border-2 border-light-primary bg-transparent" : "border-transparent"}`}
                >
                  <ThemedView
                    style={tw`flex-row items-center justify-between gap-2`}
                  >
                    <ThemedText type="body1">{option.name}</ThemedText>
                    {option.inventoryItems?.length ? (
                      <ThemedView
                        style={tw`flex-row items-center gap-1 bg-transparent`}
                      >
                        <Ionicons
                          name="cube-outline"
                          size={14}
                          color={tw.color("gray-500")}
                        />
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {t("inventory:stockCount", {
                            count:
                              getProductOptionAvailableQuantity(option) ?? 0,
                          })}
                        </ThemedText>
                      </ThemedView>
                    ) : null}
                  </ThemedView>
                  <ThemedText type="body2">
                    {formatCurrency(option.price)}
                  </ThemedText>
                </Card>
              );
            })}
          </ThemedView>
        </ThemedView>
      )}

      {showReplace && (
        <ThemedView style={tw`gap-2`}>
          {replaceBlockReason && (
            <ThemedView style={tw`flex-row items-start gap-2 px-1`}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={tw.color("gray-500")}
              />
              <ThemedText type="small" style={tw`flex-1 text-gray-500`}>
                {t(`orders:replaceItem.reasons.${replaceBlockReason}`)}
              </ThemedText>
            </ThemedView>
          )}
          <Button
            label={t("orders:detailActions.replaceItem")}
            onPress={handleReplace}
            variant="outline"
            leftIcon="swap-horizontal-outline"
          />
        </ThemedView>
      )}
    </BottomSheetView>
  );
};

export default OrderDetailVariantBottomSheet;

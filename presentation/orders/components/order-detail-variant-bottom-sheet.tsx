import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import Icon from "@/presentation/theme/components/icon";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Card from "@/presentation/theme/components/card";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
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
  canChangeVariant,
} from "@/core/orders/models/order-detail.model";

interface OrderDetailVariantBottomSheetProps {
  detail: OrderDetail;
  options: ProductOption[];
  selectedOptionId?: number;
  onSelectOption: (option: ProductOption) => void;
  onReplace?: () => void;
  /** Explains why Replace is disabled, e.g. by opening an InfoBottomSheet. */
  onReplaceBlockedInfo?: () => void;
  onClose?: () => void;
}

const OrderDetailVariantBottomSheet = ({
  detail,
  options,
  selectedOptionId,
  onSelectOption,
  onReplace,
  onReplaceBlockedInfo,
  onClose,
}: OrderDetailVariantBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders", "menu", "inventory"]);

  const variantChangeAllowed = canChangeVariant(detail);

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
  const showVariantOptions = options.length > 1 && variantChangeAllowed;
  const showVariantBlockedMessage =
    options.length > 1 && !variantChangeAllowed && !showReplace;

  return (
    <BottomSheetView style={tw`px-4 pb-6 gap-4`}>
      {showVariantOptions && (
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
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={tw.style(
                    "min-w-36 gap-2 p-4",
                    isSelected && "bg-secondary",
                  )}
                >
                  <ThemedView
                    style={tw`flex-row items-center justify-between gap-2`}
                  >
                    <ThemedText type="body1">{option.name}</ThemedText>
                    {option.inventoryItems?.length ? (
                      <ThemedView
                        style={tw`flex-row items-center gap-1 bg-transparent`}
                      >
                        <Icon
                          name="package"
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

      {showVariantBlockedMessage && (
        <ThemedView style={tw`flex-row items-center gap-4 px-1`}>
          <Icon
            name="info"
            size={16}
            color={tw.color("gray-500")}
          />
          <ThemedText type="body1" style={tw`flex-1 text-gray-500`}>
            {t("orders:variantChange.blocked")}
          </ThemedText>
        </ThemedView>
      )}

      {showReplace && (
        <ThemedView style={tw`flex-row items-center gap-2`}>
          <ThemedView style={tw`flex-1`}>
            <Button
              label={t("orders:detailActions.replaceItem")}
              onPress={handleReplace}
              variant="outline"
              leftIcon="arrow-left-right"
              disabled={!!replaceBlockReason}
            />
          </ThemedView>
          {replaceBlockReason && onReplaceBlockedInfo && (
            <IconButton
              icon="info"
              size={20}
              onPress={onReplaceBlockedInfo}
              accessibilityLabel={t("orders:replaceItem.blocked.infoLabel")}
            />
          )}
        </ThemedView>
      )}
    </BottomSheetView>
  );
};

export default OrderDetailVariantBottomSheet;

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Pressable, PressableProps } from "react-native";
import Label from "@/presentation/theme/components/label";
import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { useNewOrderStore } from "../store/newOrderStore";
import { useEditOrderCartStore } from "../store/editOrderCartStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import IconButton from "@/presentation/theme/components/icon-button";
import { typography } from "@/constants/theme";
import QuantityStepper from "./quantity-stepper";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 20;

interface NewOrderDetailCardProps extends PressableProps {
  detail: NewOrderDetail;
  orderType: OrderType;
  isEditMode?: boolean;
}

export default function NewOrderDetailCard({
  detail,
  orderType,
  isEditMode = false,
  onPress,
}: NewOrderDetailCardProps) {
  const { t } = useTranslation(["common"]);
  const { removeDetail, updateDetail } = useNewOrderStore();
  const { removeNewItem, updateNewItem } = useEditOrderCartStore();
  const onQuantityChange = (value: number) => {
    if (isEditMode && detail.id) {
      updateNewItem(detail.id, { quantity: value });
      return;
    }
    const updatedDetail = { ...detail, quantity: value };
    updateDetail(updatedDetail);
  };

  const onRemoveDetail = () => {
    if (isEditMode && detail.id) {
      removeNewItem(detail.id);
      return;
    }
    removeDetail(detail);
  };

  const showProductOptionName =
    detail.product.options.length > 1 && detail.productOption;

  return (
    <Swipeable
      renderRightActions={() => (
        <ThemedView style={tw`justify-center items-center px-4 `}>
          <IconButton
            icon="trash"
            onPress={onRemoveDetail}
            variant="destructive"
            size={26}
          />
        </ThemedView>
      )}
    >
      {/* A plain row: the cart list draws gray separators between items. */}
      <ThemedView>
        <Pressable style={tw`flex-col gap-2 py-3`} onPress={onPress}>
          {/* <ThemedView */}
          {/*   style={tw`absolute  rounded-full items-center justify-center  z-10 right-0 top-0`} */}
          {/* ></ThemedView> */}

          <ThemedView style={tw`flex-row justify-between gap-4 items-center`}>
            <ThemedText
              type="body1"
              style={{ fontFamily: typography.medium, flex: 1 }}
            >
              {detail.product.name}{" "}
              {showProductOptionName && detail.productOption.name}
            </ThemedText>

            <QuantityStepper
              value={detail.quantity}
              onChange={onQuantityChange}
              min={MIN_QUANTITY}
              max={MAX_QUANTITY}
              size="small"
            />
          </ThemedView>
          {detail.description && (
            <ThemedText type="body2" style={tw`mt-2`}>
              {detail.description}
            </ThemedText>
          )}
          {detail.tagIds && detail.tagIds.length > 0 && (
            <ThemedView style={tw`flex-row flex-wrap gap-2 bg-transparent`}>
              {detail.product.tags
                .filter((tag) => detail.tagIds!.includes(tag.id))
                .map((tag) => (
                  <Label
                    key={tag.id}
                    text={tag.name}
                    color="default"
                    size="small"
                  />
                ))}
            </ThemedView>
          )}
          {detail.typeOrderDetail && detail.typeOrderDetail !== orderType && (
            <ThemedView style={tw`flex-row gap-2 bg-transparent`}>
              <Label
                text={
                  detail.typeOrderDetail === OrderType.IN_PLACE
                    ? t("common:orderType.inPlace")
                    : t("common:orderType.takeAway")
                }
                leftIcon={
                  detail.typeOrderDetail === OrderType.IN_PLACE
                    ? "utensils"
                    : "shopping-bag"
                }
                color="outline"
                size="small"
              />
            </ThemedView>
          )}
          {/* <ThemedView style={tw`flex-row justify-between gap-4 items-center`}> */}
          {/*   <ThemedText type="body1" style={tw`text-gray-500`}> */}
          {/*     ${(detail.price ?? detail.productOption?.price ?? 0) * counter} */}
          {/*   </ThemedText> */}
          {/* </ThemedView> */}
        </Pressable>
      </ThemedView>
    </Swipeable>
  );
}

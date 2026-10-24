import { ThemedText } from "@/presentation/theme/components/themed-text";
import { getSelectableTags } from "@/core/menu/models/tag.model";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useEffect, useRef, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useReplaceOrderDetailStore } from "@/presentation/orders/store/replaceOrderDetailStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ProductOption } from "@/core/menu/models/product-optionl.model";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import BottomSheetPicker, {
  BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { useOrderDetailStatus } from "@/presentation/orders/hooks/useOrderDetailStatus";
import {
  OrderDetailStatus,
  getReplaceBlockReason,
} from "@/core/orders/models/order-detail.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { KeyboardAvoidingView } from "react-native";
import OrderDetailActivityBottomSheet from "@/presentation/orders/components/order-detail-activity-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import NoteBottomSheet from "@/presentation/orders/components/note-bottom-sheet";
import Chip from "@/presentation/theme/components/chip";
import Slider from "@/presentation/theme/components/slider";
import OrderDetailStatusBottomSheet from "@/presentation/orders/components/order-detail-status-bottom-sheet";
import OrderDetailVariantBottomSheet from "@/presentation/orders/components/order-detail-variant-bottom-sheet";
import Card from "@/presentation/theme/components/card";
import InfoBottomSheet from "@/presentation/theme/components/info-bottom-sheet";

export default function EditOrderDetailScreen() {
  const { t } = useTranslation(["common", "orders", "menu", "inventory"]);
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const noteSheetRef = useRef<BottomSheetMethods>(null);
  const activitySheetRef = useRef<BottomSheetMethods>(null);
  const variantSheetRef = useRef<BottomSheetMethods>(null);
  const statusSheetRef = useRef<BottomSheetMethods>(null);
  const replaceBlockedSheetRef = useRef<BottomSheetMethods>(null);
  const typePickerRef = useRef<BottomSheetPickerRef>(null);
  const orderDetail = useOrdersStore((state) => state.activeOrderDetail);
  const order = useOrdersStore((state) => state.activeOrder);
  const product = useMenuStore((state) =>
    state.products.find((p) => p.id === orderDetail?.product.id),
  );

  const { counter, increment, decrement } = useCounter(
    orderDetail?.quantity,
    1,
    20,
    orderDetail?.qtyDelivered || 1,
  );

  // Everything on this screen is a draft until "Save changes".
  const [status, setStatus] = useState(
    orderDetail?.status ?? OrderDetailStatus.PENDING,
  );
  const [typeOrderDetail, setTypeOrderDetail] = useState(
    orderDetail?.typeOrderDetail ?? OrderType.IN_PLACE,
  );

  const { counter: qtyDelivered, setCounter: setQtyDelivered } = useCounter(
    orderDetail?.qtyDelivered,
    1,
    orderDetail?.quantity,
    0,
  );

  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const { isLoading, mutate: updateOrderDetail } =
    useOrders().updateOrderDetail;

  const [notes, setNotes] = useState(orderDetail?.description || "");
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    orderDetail?.productOption ??
      product?.options.find((option) => option.isDefault) ??
      null,
  );
  const [price, setPrice] = useState(
    String(orderDetail?.price ?? selectedOption?.price ?? ""),
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    orderDetail?.tags?.map((t) => t.id) ?? [],
  );

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );
  const startReplace = useReplaceOrderDetailStore((state) => state.start);

  const { statusText, statusIcon, labelColor } = useOrderDetailStatus(status);

  const openCustomBottomSheet = () => {
    bottomSheetModalRef.current?.present();
  };

  const closeCustomBottomSheet = () => {
    bottomSheetModalRef.current?.dismiss();
  };

  const openVariantBottomSheet = () => {
    variantSheetRef.current?.present();
  };

  const closeVariantBottomSheet = () => {
    variantSheetRef.current?.dismiss();
  };

  const openActivityBottomSheet = () => {
    activitySheetRef.current?.present();
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
          <IconButton
            icon="info"
            onPress={openActivityBottomSheet}
            size={24}
            accessibilityLabel={t("orders:details.activity")}
          />
          <Button
            label={t("orders:detailActions.change")}
            leftIcon="arrow-left-right"
            variant="outline"
            size="small"
            onPress={openVariantBottomSheet}
          />
          {isAdmin && (
            <IconButton
              icon="square-pen"
              size={24}
              onPress={openCustomBottomSheet}
              accessibilityLabel={t("orders:detailActions.customPrice")}
            />
          )}
        </ThemedView>
      ),
    });
  }, [
    navigation,
    openCustomBottomSheet,
    openVariantBottomSheet,
    openActivityBottomSheet,
    isAdmin,
    t,
  ]);

  const openNoteBottomSheet = () => {
    noteSheetRef.current?.present();
  };

  const closeNoteBottomSheet = () => {
    noteSheetRef.current?.dismiss();
  };

  const saveNote = (note: string) => {
    setNotes(note);
    closeNoteBottomSheet();
  };

  if (!orderDetail || !product) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  const parsedPrice = parseFloat(price);
  const effectivePrice = Number.isFinite(parsedPrice)
    ? parsedPrice
    : (selectedOption?.price ?? orderDetail.price);

  const onChangeSelectedOption = (option: ProductOption) => {
    setSelectedOption(option);
    setPrice(String(option.price));
  };

  const replaceBlockReason = getReplaceBlockReason(orderDetail);

  const handleReplaceProduct = () => {
    startReplace(order!.id, orderDetail);
    router.push("/(new-order)/restaurant-menu");
  };

  const onUpdateOrderDetail = () => {
    updateOrderDetail(
      {
        id: orderDetail.id,
        quantity: counter,
        qtyDelivered,
        description: notes,
        price: effectivePrice,
        orderId: order!.id,
        tagIds: selectedTagIds,
        productOptionId: selectedOption?.id,
        ...(status !== orderDetail.status && { status }),
        ...(typeOrderDetail !== orderDetail.typeOrderDetail && {
          typeOrderDetail,
        }),
      },
      {
        onSuccess: () => {
          setActiveOrderDetail(null);
          router.back();
        },
      },
    );
  };

  const openStatusSheet = () => {
    statusSheetRef.current?.present();
  };

  // Delivered means every unit went out; back to pending means none did.
  const onSelectStatus = (nextStatus: OrderDetailStatus) => {
    setStatus(nextStatus);
    setQtyDelivered(
      nextStatus === OrderDetailStatus.DELIVERED ? orderDetail.quantity : 0,
    );
    statusSheetRef.current?.dismiss();
  };

  return (
    <>
      <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
        <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
          <ThemedView style={tw`flex-1`} />
          <ThemedView style={tw` text-center mb-4 gap-4`}>
            <ThemedView style={tw`flex-row items-center gap-2 flex-wrap  `}>
              <Label
                text={statusText}
                color={labelColor}
                leftIcon={statusIcon}
                rightIcon="chevron-down"
                onPress={openStatusSheet}
                accessibilityLabel={`${t("orders:detailActions.statusTitle")}: ${statusText}`}
                hitSlop={8}
                size="small"
              />
              {orderDetail.readyQuantity > 0 && (
                <Label
                  leftIcon="bell"
                  text={t("orders:detailActions.readyCount", {
                    count: orderDetail.readyQuantity,
                  })}
                  color="success"
                  size="small"
                />
              )}
            </ThemedView>

            <ThemedView style={tw`gap-2 mb-2`}>
              <ThemedView
                style={tw`flex-row items-center justify-between gap-2`}
              >
                <ThemedText type="h3">
                  {product.name}
                  {product.options.length > 1 && selectedOption && (
                    <ThemedText type="h3" style={tw``}>
                      {" "}
                      {selectedOption.name}
                    </ThemedText>
                  )}
                </ThemedText>
                <ThemedText type="body1">
                  {formatCurrency(counter * effectivePrice)}
                </ThemedText>
              </ThemedView>
              {product.description && (
                <ThemedText type="body1" style={tw`text-gray-600`}>
                  {product.description}
                </ThemedText>
              )}
            </ThemedView>
            {notes.trim() && (
              <TextInput
                numberOfLines={4}
                multiline
                value={notes}
                onChangeText={setNotes}
                placeholder={t("orders:newOrder.addNote")}
                pointerEvents="none"
                style={tw`bg-transparent`}
                containerStyle={tw`bg-transparent border-0 p-0`}
              />
            )}

            {orderDetail.quantity > 1 && (
              <Card style={tw`gap-1`} variant="default">
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("common:status.delivered")}
                  </ThemedText>
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {qtyDelivered} / {orderDetail.quantity}
                  </ThemedText>
                </ThemedView>
                <Slider
                  value={qtyDelivered}
                  minimumValue={0}
                  maximumValue={orderDetail.quantity}
                  step={1}
                  height={12}
                  onValueChange={setQtyDelivered}
                  onSlidingComplete={setQtyDelivered}
                />
              </Card>
            )}

            {getSelectableTags(product.tags).length > 0 && (
              <ThemedView style={tw`flex-row flex-wrap gap-2 `}>
                {getSelectableTags(product.tags).map((tag) => (
                  <Label
                    key={tag.id}
                    text={tag.name}
                    color={
                      selectedTagIds.includes(tag.id) ? "default" : "outline"
                    }
                    onPress={() => toggleTag(tag.id)}
                  />
                ))}
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={tw`gap-8`}>
            <ThemedView style={tw`flex-row  justify-center gap-4 w-full `}>
              <ThemedView style={tw`flex-row items-center gap-6`}>
                <IconButton
                  icon="minus"
                  onPress={decrement}
                  variant="surface"
                  size={50}
                  accessibilityLabel={t("common:actions.decrease")}
                />
                <ThemedText type="h1" accessibilityLiveRegion="polite">
                  {counter}
                </ThemedText>
                <IconButton
                  icon="plus"
                  onPress={increment}
                  variant="surface"
                  size={50}
                  accessibilityLabel={t("common:actions.increase")}
                />
              </ThemedView>
            </ThemedView>
            <ThemedView style={tw`flex-row items-center justify-center gap-2 `}>
              <Chip
                label={
                  typeOrderDetail === OrderType.IN_PLACE
                    ? t("common:orderType.inPlace")
                    : t("common:orderType.takeAway")
                }
                icon={
                  typeOrderDetail === OrderType.IN_PLACE
                    ? "utensils"
                    : "shopping-bag"
                }
                variant="filter"
                onPress={() => typePickerRef.current?.present()}
              />

              {!notes.trim() && (
                <Chip
                  variant="assist"
                  label={t("orders:newOrder.addNote")}
                  icon="file-text"
                  onPress={openNoteBottomSheet}
                />
              )}
            </ThemedView>

            <ThemedView style={tw`flex-row gap-5  mb-4`}>
              <Button
                label={t("orders:edit.saveChanges")}
                onPress={onUpdateOrderDetail}
                leftIcon="save"
                loading={isLoading}
                style={tw`flex-1`}
              />
            </ThemedView>
          </ThemedView>
        </ScreenLayout>

        <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
          <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
            <TextInput
              label={t("orders:newOrder.customPrice")}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              bottomSheet
            />

            <Button
              label={t("common:actions.done")}
              onPress={closeCustomBottomSheet}
            />
          </BottomSheetView>
        </ThemedBottomSheetModal>

        <NoteBottomSheet
          ref={noteSheetRef}
          initialValue={notes}
          onSave={saveNote}
          placeholder={t("orders:newOrder.addNote")}
        />

        <OrderDetailStatusBottomSheet
          ref={statusSheetRef}
          value={status}
          onSelectStatus={onSelectStatus}
        />

        <OrderDetailActivityBottomSheet
          detail={orderDetail}
          bottomSheetRef={activitySheetRef}
        />

        <ThemedBottomSheetModal ref={variantSheetRef} enablePanDownToClose>
          <OrderDetailVariantBottomSheet
            detail={orderDetail}
            options={product.options}
            selectedOptionId={selectedOption?.id}
            onSelectOption={onChangeSelectedOption}
            onReplace={handleReplaceProduct}
            onReplaceBlockedInfo={() =>
              replaceBlockedSheetRef.current?.present()
            }
            onClose={closeVariantBottomSheet}
          />
        </ThemedBottomSheetModal>

        {replaceBlockReason && (
          <InfoBottomSheet
            ref={replaceBlockedSheetRef}
            title={t("orders:replaceItem.blocked.title")}
            message={t(`orders:replaceItem.reasons.${replaceBlockReason}`)}
          />
        )}

        <BottomSheetPicker
          ref={typePickerRef}
          title={t("orders:newOrder.orderType")}
          options={[
            { label: t("common:orderType.inPlace"), value: OrderType.IN_PLACE },
            {
              label: t("common:orderType.takeAway"),
              value: OrderType.TAKE_AWAY,
            },
          ]}
          value={typeOrderDetail}
          onChange={(value) => setTypeOrderDetail(value as OrderType)}
        />
      </KeyboardAvoidingView>
    </>
  );
}

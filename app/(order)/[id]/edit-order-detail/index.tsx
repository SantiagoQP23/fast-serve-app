import { ThemedText } from "@/presentation/theme/components/themed-text";
import { getSelectableTags } from "@/core/menu/models/tag.model";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useEffect, useRef, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Icon from "@/presentation/theme/components/icon";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useReplaceOrderDetailStore } from "@/presentation/orders/store/replaceOrderDetailStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";
import { DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK } from "@/core/restaurant/models/restaurant-settings.model";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import {
  ProductOption,
  getProductOptionAvailableQuantity,
} from "@/core/menu/models/product-optionl.model";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { useOrderDetailStatus } from "@/presentation/orders/hooks/useOrderDetailStatus";
import {
  OrderDetailStatus,
  getReplaceBlockReason,
} from "@/core/orders/models/order-detail.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { toast } from "sonner-native";
import OrderDetailActivityBottomSheet from "@/presentation/orders/components/order-detail-activity-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import NoteBottomSheet from "@/presentation/orders/components/note-bottom-sheet";
import Chip from "@/presentation/theme/components/chip";
import Label from "@/presentation/theme/components/label";
import ButtonGroup from "@/presentation/theme/components/button-group";
import Card from "@/presentation/theme/components/card";
import Slider from "@/presentation/theme/components/slider";
import OrderDetailVariantBottomSheet from "@/presentation/orders/components/order-detail-variant-bottom-sheet";
import InfoBottomSheet from "@/presentation/theme/components/info-bottom-sheet";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import { typography } from "@/constants/theme";

const MAX_QUANTITY = 20;

const sameIds = (a: string[], b: string[]) =>
  [...a].sort().join() === [...b].sort().join();

export default function EditOrderDetailScreen() {
  const { t } = useTranslation(["common", "orders", "menu", "inventory"]);
  const customPriceSheetRef = useRef<BottomSheetMethods>(null);
  const moreSheetRef = useRef<BottomSheetMethods>(null);
  const noteSheetRef = useRef<BottomSheetMethods>(null);
  const activitySheetRef = useRef<BottomSheetMethods>(null);
  const variantSheetRef = useRef<BottomSheetMethods>(null);
  const replaceBlockedSheetRef = useRef<BottomSheetMethods>(null);
  const orderDetail = useOrdersStore((state) => state.activeOrderDetail);
  const order = useOrdersStore((state) => state.activeOrder);
  const product = useMenuStore((state) =>
    state.products.find((p) => p.id === orderDetail?.product.id),
  );

  // Everything on this screen is a draft until "Save changes".
  const [qtyDelivered, setQtyDelivered] = useState(
    orderDetail?.qtyDelivered ?? 0,
  );

  // Delivered units, and units already on a bill, can't be taken off the
  // order, so the quantity never drops below them.
  const minQuantity = Math.max(1, qtyDelivered, orderDetail?.qtyPaid ?? 0);
  const { counter, increment, decrement, setCounter } = useCounter(
    orderDetail?.quantity,
    1,
    MAX_QUANTITY,
    minQuantity,
  );

  // What's typed in the quantity box, while it's being edited.
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null);

  // Typed digits update the quantity right away, kept within its bounds.
  const onChangeQuantityInput = (text: string) => {
    const digits = text.replace(/\D/g, "");
    setQuantityDraft(digits);
    const parsed = parseInt(digits, 10);
    if (Number.isNaN(parsed)) return;
    setCounter(Math.min(MAX_QUANTITY, Math.max(minQuantity, parsed)));
  };

  const clearQuantityDraft = () => setQuantityDraft(null);

  const [typeOrderDetail, setTypeOrderDetail] = useState(
    orderDetail?.typeOrderDetail ?? OrderType.IN_PLACE,
  );

  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const { isLoading, mutate: updateOrderDetail } =
    useOrders().updateOrderDetail;

  const { settings } = useRestaurantSettings();
  // With the setting off, the server rejects anything beyond the stock left,
  // so don't let the waiter ask for it.
  const blocksWithoutStock =
    (settings?.ALLOW_ORDERS_WITHOUT_STOCK ??
      DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK) === false;

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

  // The waiter only says how many units went out; the status follows. All
  // of them delivered is DELIVERED. Taking a delivered item back sends it to
  // the kitchen again (PENDING). Otherwise the kitchen's status stands.
  const originalStatus = orderDetail?.status ?? OrderDetailStatus.PENDING;
  const status =
    qtyDelivered >= counter
      ? OrderDetailStatus.DELIVERED
      : originalStatus === OrderDetailStatus.DELIVERED
        ? OrderDetailStatus.PENDING
        : originalStatus;

  const { statusText, statusIcon, labelColor } = useOrderDetailStatus(status);

  const parsedPrice = parseFloat(price);
  const isPriceValid = Number.isFinite(parsedPrice) && parsedPrice >= 0;
  const effectivePrice = isPriceValid
    ? parsedPrice
    : (selectedOption?.price ?? orderDetail?.price ?? 0);

  const isDirty =
    !!orderDetail &&
    (counter !== orderDetail.quantity ||
      qtyDelivered !== orderDetail.qtyDelivered ||
      notes !== (orderDetail.description || "") ||
      effectivePrice !== Number(orderDetail.price) ||
      typeOrderDetail !== orderDetail.typeOrderDetail ||
      (selectedOption?.id ?? null) !==
        (orderDetail.productOption?.id ?? null) ||
      !sameIds(selectedTagIds, orderDetail.tags?.map((tag) => tag.id) ?? []));

  // Leaving with unsaved edits asks first. A successful save leaves freely.
  const [showDiscard, setShowDiscard] = useState(false);
  const pendingAction = useRef<any>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!isDirty || savedRef.current) return;
      e.preventDefault();
      pendingAction.current = e.data.action;
      setShowDiscard(true);
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  const replaceBlockReason = orderDetail
    ? getReplaceBlockReason(orderDetail)
    : null;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ThemedView style={tw`flex-row items-center gap-1 bg-transparent`}>
          <IconButton
            icon="history"
            onPress={() => activitySheetRef.current?.present()}
            size={20}
            accessibilityLabel={t("orders:details.activity")}
          />
          <IconButton
            icon="ellipsis-vertical"
            onPress={() => moreSheetRef.current?.present()}
            size={20}
            accessibilityLabel={t("orders:details.moreOptions")}
          />
        </ThemedView>
      ),
    });
  }, [navigation, t]);

  if (!orderDetail || !product) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center gap-6 px-8`}>
        <ThemedText type="h3" style={tw`text-center`}>
          {t("orders:details.noActiveOrder")}
        </ThemedText>
        <Button
          label={t("common:actions.goBack")}
          variant="outline"
          onPress={() => router.back()}
        />
      </ThemedView>
    );
  }

  // Units of this line were taken from stock when it was ordered, so keeping
  // the same variant only needs stock for the units added.
  const available = selectedOption
    ? getProductOptionAvailableQuantity(selectedOption)
    : null;
  const stockLeft =
    available === null
      ? null
      : selectedOption?.id === orderDetail.productOption?.id
        ? Math.max(available, 0) + orderDetail.quantity
        : Math.max(available, 0);
  const exceedsStock = stockLeft !== null && counter > stockLeft;
  const blockedByStock = blocksWithoutStock && exceedsStock;
  const atStockLimit =
    blocksWithoutStock && stockLeft !== null && counter >= stockLeft;

  // A price typed by hand survives a variant change; the menu price doesn't.
  const onChangeSelectedOption = (option: ProductOption) => {
    if (!isPriceValid || parsedPrice === selectedOption?.price) {
      setPrice(String(option.price));
    }
    setSelectedOption(option);
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
          savedRef.current = true;
          toast.success(t("orders:edit.saved"));
          setActiveOrderDetail(null);
          router.back();
        },
      },
    );
  };

  // Always offered; when the item can't be replaced, it explains why.
  const handleReplaceProduct = () => {
    moreSheetRef.current?.dismiss();
    if (replaceBlockReason) {
      replaceBlockedSheetRef.current?.present();
      return;
    }
    if (!order) return;
    startReplace(order.id, orderDetail);
    router.push("/(new-order)/restaurant-menu");
  };

  const hasNote = notes.trim() !== "";
  const hasVariants = product.options.length > 1;
  const selectableTags = getSelectableTags(product.tags);
  const lineTotal = counter * effectivePrice;
  const floorReason =
    counter === minQuantity && minQuantity > 1
      ? (orderDetail.qtyPaid ?? 0) >= minQuantity
        ? t("orders:edit.quantityFloorBilled", { count: minQuantity })
        : t("orders:edit.quantityFloorDelivered", { count: minQuantity })
      : null;

  return (
    <>
      <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
        <ScreenLayout>
          {/* Content sits at the bottom, near the thumb, and scrolls once it
              outgrows the screen. */}
          <ScrollView
            contentContainerStyle={tw` px-4 pt-6 pb-4 gap-6`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ThemedView style={tw`gap-3`}>
              <ThemedView style={tw`gap-1`}>
                <ThemedText type="h3" accessibilityRole="header">
                  {product.name}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {hasVariants && selectedOption
                    ? `${selectedOption.name} · ${formatCurrency(effectivePrice)}`
                    : formatCurrency(effectivePrice)}
                </ThemedText>
              </ThemedView>

              {product.description ? (
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {product.description}
                </ThemedText>
              ) : null}

              <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                <Label
                  text={statusText}
                  color={labelColor}
                  leftIcon={statusIcon}
                  size="small"
                  accessibilityHint={t("orders:detailActions.statusTitle")}
                />
                {orderDetail.readyQuantity > 0 &&
                  status !== OrderDetailStatus.DELIVERED && (
                    <Label
                      text={t("orders:detailActions.readyCount", {
                        count: orderDetail.readyQuantity,
                      })}
                      color="success"
                      leftIcon="bell"
                      size="small"
                    />
                  )}
              </ThemedView>

              {/* The note itself, or "Add note" when there is none: tap to edit. */}
              <Pressable
                onPress={() => noteSheetRef.current?.present()}
                accessibilityRole="button"
                accessibilityLabel={
                  hasNote
                    ? `${t("menu:product.editNote")}: ${notes}`
                    : t("orders:newOrder.addNote")
                }
                style={({ pressed }) => [
                  tw`self-start py-3 min-h-12 justify-center`,
                  hasNote && tw`self-stretch`,
                  pressed && tw`opacity-60`,
                ]}
              >
                <ThemedText
                  type="body2"
                  numberOfLines={hasNote ? 3 : 1}
                  style={!hasNote && tw`text-gray-500`}
                >
                  {hasNote ? notes : `${t("orders:newOrder.addNote")}...`}
                </ThemedText>
              </Pressable>

              <View style={tw`flex-row`}>
                <ButtonGroup
                  options={[
                    {
                      label: t("common:orderType.inPlace"),
                      value: OrderType.IN_PLACE,
                      icon: "utensils",
                    },
                    {
                      label: t("common:orderType.takeAway"),
                      value: OrderType.TAKE_AWAY,
                      icon: "shopping-bag",
                    },
                  ]}
                  size="small"
                  selected={typeOrderDetail}
                  onChange={(value: OrderType) => setTypeOrderDetail(value)}
                />
              </View>
            </ThemedView>

            <Card style={tw`gap-2`} variant="default">
              <ThemedView
                style={tw`flex-row items-center justify-between bg-transparent`}
              >
                <ThemedText type="body2">
                  {t("orders:edit.delivered")}
                </ThemedText>
                <ThemedText
                  type="body2"
                  accessibilityLiveRegion="polite"
                  style={{ fontFamily: typography.bold }}
                >
                  {t("orders:edit.deliveredCount", {
                    delivered: qtyDelivered,
                    total: counter,
                  })}
                </ThemedText>
              </ThemedView>
              <Slider
                value={qtyDelivered}
                minimumValue={0}
                maximumValue={counter}
                step={1}
                height={12}
                onValueChange={setQtyDelivered}
                onSlidingComplete={setQtyDelivered}
              />
            </Card>

            {selectableTags.length > 0 && (
              <ThemedView style={tw`flex-row flex-wrap gap-2`}>
                {selectableTags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    selected={selectedTagIds.includes(tag.id)}
                    onPress={() => toggleTag(tag.id)}
                  />
                ))}
              </ThemedView>
            )}

            {hasVariants && selectedOption && (
              <View style={tw`flex-row`}>
                <Chip
                  variant="assist"
                  icon="layers"
                  label={selectedOption.name}
                  onPress={() => variantSheetRef.current?.present()}
                />
              </View>
            )}
          </ScrollView>

          <ThemedView style={tw`px-4 pt-2 pb-4 gap-3`}>
            <ThemedView style={tw`flex-row items-center justify-center gap-3`}>
              <IconButton
                icon="minus"
                onPress={() => {
                  clearQuantityDraft();
                  decrement();
                }}
                disabled={counter <= minQuantity}
                variant="surface"
                size={28}
                style={tw`p-4`}
                accessibilityLabel={t("common:actions.decrease")}
              />
              <TextInput
                variant="filled"
                inputMode="numeric"
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={2}
                selectTextOnFocus
                value={quantityDraft ?? String(counter)}
                onChangeText={onChangeQuantityInput}
                onBlur={clearQuantityDraft}
                onSubmitEditing={clearQuantityDraft}
                accessibilityLabel={t("menu:product.quantityValue", {
                  count: counter,
                })}
                containerStyle={tw`w-20 px-1 min-h-15`}
                style={[
                  tw`h-15 mt-0 text-center`,
                  { fontSize: 24, fontFamily: typography.bold },
                ]}
              />
              <IconButton
                icon="plus"
                onPress={() => {
                  clearQuantityDraft();
                  increment();
                }}
                disabled={counter >= MAX_QUANTITY || atStockLimit}
                variant="surface"
                size={28}
                style={tw`p-4`}
                accessibilityLabel={t("common:actions.increase")}
              />
            </ThemedView>

            {floorReason && (
              <ThemedText type="small" style={tw`text-gray-500 text-center`}>
                {floorReason}
              </ThemedText>
            )}

            {exceedsStock && (
              <ThemedView
                style={tw`flex-row items-center justify-center gap-1.5`}
              >
                <Icon
                  name="circle-alert"
                  size={16}
                  color={tw.color("orange-700")}
                />
                <ThemedText type="small" style={tw`text-orange-700`}>
                  {stockLeft === 0
                    ? t("menu:product.stock.noneLeft")
                    : t("menu:product.stock.exceeds", { count: stockLeft })}
                </ThemedText>
              </ThemedView>
            )}

            <Button
              label={`${t("orders:edit.saveChanges")} · ${formatCurrency(lineTotal)}`}
              onPress={onUpdateOrderDetail}
              loading={isLoading}
              disabled={!isDirty || blockedByStock || isLoading}
            />
          </ThemedView>
        </ScreenLayout>

        <ThemedBottomSheetModal ref={customPriceSheetRef} enablePanDownToClose>
          <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
            <ThemedText type="h4">
              {t("orders:newOrder.customPrice")}
            </ThemedText>
            <TextInput
              label={t("menu:product.price")}
              icon="dollar-sign"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              error={isPriceValid ? undefined : t("orders:edit.invalidPrice")}
              bottomSheet
            />
            {selectedOption && (
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("orders:edit.menuPrice", {
                  price: formatCurrency(selectedOption.price),
                })}
              </ThemedText>
            )}

            <Button
              label={t("common:actions.done")}
              disabled={!isPriceValid}
              onPress={() => customPriceSheetRef.current?.dismiss()}
            />
          </BottomSheetView>
        </ThemedBottomSheetModal>

        <ThemedBottomSheetModal ref={moreSheetRef} enablePanDownToClose>
          <ActionsBottomSheet
            items={[
              {
                icon: "arrow-left-right",
                label: t("orders:detailActions.replaceItem"),
                onPress: handleReplaceProduct,
              },
              ...(isAdmin
                ? [
                    {
                      icon: "circle-dollar-sign" as const,
                      label: t("orders:detailActions.customPrice"),
                      hint: formatCurrency(effectivePrice),
                      onPress: () => {
                        moreSheetRef.current?.dismiss();
                        customPriceSheetRef.current?.present();
                      },
                    },
                  ]
                : []),
            ]}
          />
        </ThemedBottomSheetModal>

        <NoteBottomSheet
          ref={noteSheetRef}
          initialValue={notes}
          onSave={(note) => {
            setNotes(note.trim());
            noteSheetRef.current?.dismiss();
          }}
          placeholder={t("orders:newOrder.addNote")}
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
            onClose={() => variantSheetRef.current?.dismiss()}
          />
        </ThemedBottomSheetModal>

        {replaceBlockReason && (
          <InfoBottomSheet
            ref={replaceBlockedSheetRef}
            title={t("orders:replaceItem.blocked.title")}
            message={t(`orders:replaceItem.reasons.${replaceBlockReason}`)}
          />
        )}
      </KeyboardAvoidingView>

      <DialogModal
        visible={showDiscard}
        title={t("orders:edit.discardTitle")}
        message={t("orders:edit.discardMessage")}
        confirmLabel={t("orders:edit.discard")}
        cancelLabel={t("orders:edit.keepEditing")}
        confirmVariant="destructive"
        onConfirm={() => {
          setShowDiscard(false);
          savedRef.current = true;
          if (pendingAction.current) navigation.dispatch(pendingAction.current);
        }}
        onCancel={() => {
          pendingAction.current = null;
          setShowDiscard(false);
        }}
      />
    </>
  );
}

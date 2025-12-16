import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { OrderType } from "@/core/orders/enums/order-type.enum";

export const useOrderTypes = () => {
  const { t } = useTranslation('common');

  return [
    { label: t('orderType.inPlace'), value: OrderType.IN_PLACE },
    { label: t('orderType.takeAway'), value: OrderType.TAKE_AWAY },
  ];
};

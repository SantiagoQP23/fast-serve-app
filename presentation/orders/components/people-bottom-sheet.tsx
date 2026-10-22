import { forwardRef } from "react";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import NumberWheelBottomSheet, {
  type NumberWheelBottomSheetRef,
} from "@/presentation/theme/components/number-wheel-bottom-sheet";

const MAX_PEOPLE = 25;

export type PeopleBottomSheetRef = NumberWheelBottomSheetRef;

interface PeopleBottomSheetProps {
  value: number;
  onDone: (people: number) => void;
}

/** Picks how many people the order is for on a wheel, committed on Done. */
const PeopleBottomSheet = forwardRef<
  PeopleBottomSheetRef,
  PeopleBottomSheetProps
>(({ value, onDone }, ref) => {
  const { t } = useTranslation("orders");

  return (
    <NumberWheelBottomSheet
      ref={ref}
      title={t("form.people")}
      value={value}
      max={MAX_PEOPLE}
      onDone={onDone}
    />
  );
});

PeopleBottomSheet.displayName = "PeopleBottomSheet";

export default PeopleBottomSheet;

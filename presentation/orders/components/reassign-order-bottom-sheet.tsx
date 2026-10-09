import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { User } from "@/core/auth/models/user.model";
import { useUsers } from "@/presentation/users/hooks/useUsers";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";

interface ReassignOrderBottomSheetProps {
  selectedUserId?: string;
  onSelectUser: (user: User) => void;
}

export type ReassignOrderBottomSheetRef = BottomSheetPickerRef;

const ReassignOrderBottomSheet = forwardRef<
  ReassignOrderBottomSheetRef,
  ReassignOrderBottomSheetProps
>(({ selectedUserId, onSelectUser }, ref) => {
  const { t } = useTranslation(["common", "orders"]);
  const { users } = useUsers();
  const pickerRef = useRef<BottomSheetPickerRef>(null);

  useImperativeHandle(ref, () => ({
    present: () => pickerRef.current?.present(),
    dismiss: () => pickerRef.current?.dismiss(),
  }));

  const options = useMemo(
    () =>
      users.map((user) => ({
        label: `${user.person.firstName} ${user.person.lastName}`,
        value: user.id,
      })),
    [users],
  );

  const handleChange = (value: string | number) => {
    const user = users.find((u) => u.id === value);
    if (user) onSelectUser(user);
  };

  return (
    <BottomSheetPicker
      ref={pickerRef}
      title={t("orders:options.reassignOrder")}
      options={options}
      value={selectedUserId}
      onChange={handleChange}
    />
  );
});

ReassignOrderBottomSheet.displayName = "ReassignOrderBottomSheet";

export default ReassignOrderBottomSheet;

import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { ThemedView } from "./themed-view";
import IconButton from "./icon-button";
import tw from "../lib/tailwind";

interface SwipeableRowProps {
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

export default function SwipeableRow({
  onEdit,
  onDelete,
  children,
}: SwipeableRowProps) {
  if (!onEdit && !onDelete) {
    return <>{children}</>;
  }

  return (
    <Swipeable
      renderRightActions={() => (
        <ThemedView style={tw`flex-row items-center gap-2 pl-2 bg-transparent`}>
          {onEdit && (
            <IconButton
              icon="create-outline"
              variant="outlined"
              onPress={onEdit}
            />
          )}
          {onDelete && (
            <IconButton
              icon="trash-outline"
              variant="destructive"
              onPress={onDelete}
            />
          )}
        </ThemedView>
      )}
    >
      {children}
    </Swipeable>
  );
}

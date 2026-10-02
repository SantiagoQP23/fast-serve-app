import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import SalesContent from "@/presentation/orders/components/sales-content";

export default function SalesScreen() {
  return (
    <ScreenLayout style={tw`pt-8`}>
      <SalesContent />
    </ScreenLayout>
  );
}

import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import MenuOverviewContent from "@/presentation/menu-management/components/menu-overview-content";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

/** The Menú page, opened from the Productos hub. */
export default function MenuOverviewScreen() {
  // Expanded: MenuOverviewContent lays out its own list + detail panes
  const { isExpanded } = useResponsiveLayout();

  return (
    <ScreenLayout fullWidth={isExpanded} style={tw`flex-1`}>
      <MenuOverviewContent />
    </ScreenLayout>
  );
}

import { useRef } from "react";
import { ScrollView, View, LayoutChangeEvent } from "react-native";
import Chip from "@/presentation/theme/components/chip";
import tw from "@/presentation/theme/lib/tailwind";

const PEOPLE_OPTIONS = Array.from({ length: 25 }, (_, i) => i + 1);

interface PeopleSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const PeopleSelector = ({ value, onChange }: PeopleSelectorProps) => {
  const scrollRef = useRef<ScrollView>(null);
  const hasCenteredInitial = useRef(false);

  const centerOnSelected = (count: number, x: number) => {
    if (hasCenteredInitial.current || count !== value) return;
    hasCenteredInitial.current = true;
    scrollRef.current?.scrollTo({ x: Math.max(x - 16, 0), animated: false });
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tw`gap-2 pr-2`}
    >
      {PEOPLE_OPTIONS.map((count) => (
        <View
          key={count}
          onLayout={(e: LayoutChangeEvent) =>
            centerOnSelected(count, e.nativeEvent.layout.x)
          }
        >
          <Chip
            label={count.toString()}
            selected={value === count}
            onPress={() => onChange(count)}
          />
        </View>
      ))}
    </ScrollView>
  );
};

export default PeopleSelector;

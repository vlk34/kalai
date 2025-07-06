"use client";
import { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";

interface HeightSelectorProps {
  currentValue?: number;
  onValueChange: (height: number) => void;
}

const HeightSelectorOnboarding = ({
  currentValue,
  onValueChange,
}: HeightSelectorProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedHeight, setSelectedHeight] = useState(160);
  const [hasScrolled, setHasScrolled] = useState(false);

  const itemHeight = 40;
  const centerOffset = 80;

  // Generate metric heights only (100cm to 220cm)
  const heights = Array.from({ length: 121 }, (_, i) => i + 100);

  // Set initial value only once on mount
  useEffect(() => {
    if (currentValue && !hasScrolled) {
      setSelectedHeight(currentValue);
      const index = heights.indexOf(currentValue);
      if (index !== -1) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: index * itemHeight,
            animated: false,
          });
        }, 100);
      }
    } else if (!currentValue && !hasScrolled) {
      // Set default value and scroll to it
      const defaultHeight = 160;
      setSelectedHeight(defaultHeight);
      const index = heights.indexOf(defaultHeight);
      if (index !== -1) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: index * itemHeight,
            animated: false,
          });
        }, 100);
      }
    }
  }, [currentValue]);

  const handleScroll = (event: any) => {
    setHasScrolled(true);
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const height = heights[index];
    if (height && height !== selectedHeight) {
      setSelectedHeight(height);
      onValueChange(height);
    }
  };

  const formatHeight = (height: number) => {
    return `${height} cm`;
  };

  const getItemOpacity = (index: number, currentIndex: number) => {
    const distance = Math.abs(index - currentIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.7;
    if (distance === 2) return 0.4;
    return 0.2;
  };

  const currentIndex = heights.indexOf(selectedHeight);

  return (
    <View
      className="bg-white border border-gray-200 rounded-2xl"
      style={{ height: 160 }}
    >
      <View className="flex-1 relative">
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingTop: centerOffset,
            paddingBottom: centerOffset,
          }}
          nestedScrollEnabled={true}
        >
          {heights.map((height, index) => (
            <View
              key={height}
              className="items-center justify-center"
              style={{ height: itemHeight }}
            >
              <Text
                className={`text-lg ${
                  height === selectedHeight
                    ? "font-bold text-black"
                    : "font-normal text-gray-600"
                }`}
                style={{
                  opacity: getItemOpacity(index, currentIndex),
                }}
              >
                {formatHeight(height)}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Center Selection Indicator Lines */}
        <View
          className="absolute left-8 right-8 pointer-events-none"
          style={{
            top: centerOffset - 1,
            height: 2,
            backgroundColor: "#E5E7EB",
          }}
        />
        <View
          className="absolute left-8 right-8 pointer-events-none"
          style={{
            top: centerOffset + itemHeight - 1,
            height: 2,
            backgroundColor: "#E5E7EB",
          }}
        />
      </View>
    </View>
  );
};

export default HeightSelectorOnboarding;

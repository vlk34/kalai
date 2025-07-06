"use client";
import { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";

interface WeightSelectorProps {
  currentValue?: number;
  onValueChange: (weight: number) => void;
}

const WeightSelectorOnboarding = ({
  currentValue,
  onValueChange,
}: WeightSelectorProps) => {
  const wholeScrollRef = useRef<ScrollView>(null);
  const decimalScrollRef = useRef<ScrollView>(null);

  const parseWeight = (weight?: number) => {
    const w = weight || 70;
    const whole = Math.floor(w);
    const decimal = Math.round((w - whole) * 10);
    return { whole, decimal };
  };

  const initialWeight = parseWeight(currentValue);
  const [selectedWhole, setSelectedWhole] = useState(initialWeight.whole);
  const [selectedDecimal, setSelectedDecimal] = useState(initialWeight.decimal);
  const [hasScrolled, setHasScrolled] = useState(false);

  const itemHeight = 40;
  const centerOffset = 80;

  // Generate metric weights only (30kg to 180kg)
  const wholeWeights = Array.from({ length: 151 }, (_, i) => i + 30);
  const decimalWeights = Array.from({ length: 10 }, (_, i) => i);

  // Set initial values only once on mount
  useEffect(() => {
    if (currentValue && !hasScrolled) {
      const parsed = parseWeight(currentValue);
      setSelectedWhole(parsed.whole);
      setSelectedDecimal(parsed.decimal);

      setTimeout(() => {
        const wholeIndex = wholeWeights.indexOf(parsed.whole);
        const decimalIndex = parsed.decimal;

        if (wholeIndex !== -1) {
          wholeScrollRef.current?.scrollTo({
            y: wholeIndex * itemHeight,
            animated: false,
          });
        }
        if (decimalIndex >= 0) {
          decimalScrollRef.current?.scrollTo({
            y: decimalIndex * itemHeight,
            animated: false,
          });
        }
      }, 100);
    }
  }, [currentValue]);

  // Update parent when values change
  useEffect(() => {
    const fullWeight = selectedWhole + selectedDecimal / 10;
    onValueChange(fullWeight);
  }, [selectedWhole, selectedDecimal]);

  const handleWholeScroll = (event: any) => {
    setHasScrolled(true);
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const weight = wholeWeights[index];
    if (weight && weight !== selectedWhole) {
      setSelectedWhole(weight);
    }
  };

  const handleDecimalScroll = (event: any) => {
    setHasScrolled(true);
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const decimal = decimalWeights[index];
    if (decimal !== undefined && decimal !== selectedDecimal) {
      setSelectedDecimal(decimal);
    }
  };

  const getItemOpacity = (index: number, currentIndex: number) => {
    const distance = Math.abs(index - currentIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.7;
    if (distance === 2) return 0.4;
    return 0.2;
  };

  const currentWholeIndex = wholeWeights.indexOf(selectedWhole);
  const currentDecimalIndex = selectedDecimal;

  return (
    <View
      className="bg-white border border-gray-200 rounded-2xl"
      style={{ height: 160 }}
    >
      <View className="flex-1 relative">
        {/* Center Selection Indicator Lines */}
        <View
          className="absolute left-8 right-8 pointer-events-none z-10"
          style={{
            top: centerOffset - 1,
            height: 2,
            backgroundColor: "#E5E7EB",
          }}
        />
        <View
          className="absolute left-8 right-8 pointer-events-none z-10"
          style={{
            top: centerOffset + itemHeight - 1,
            height: 2,
            backgroundColor: "#E5E7EB",
          }}
        />

        {/* Two Column Layout */}
        <View className="flex-1 flex-row">
          {/* Whole Number Column */}
          <View className="flex-1">
            <ScrollView
              ref={wholeScrollRef}
              showsVerticalScrollIndicator={false}
              onScroll={handleWholeScroll}
              scrollEventThrottle={16}
              snapToInterval={itemHeight}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingTop: centerOffset,
                paddingBottom: centerOffset,
              }}
              nestedScrollEnabled={true}
            >
              {wholeWeights.map((weight, index) => (
                <View
                  key={weight}
                  className="items-center justify-center"
                  style={{ height: itemHeight }}
                >
                  <Text
                    className={`text-lg ${
                      weight === selectedWhole
                        ? "font-bold text-black"
                        : "font-normal text-gray-600"
                    }`}
                    style={{
                      opacity: getItemOpacity(index, currentWholeIndex),
                    }}
                  >
                    {weight}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Decimal Column */}
          <View className="flex-1">
            <ScrollView
              ref={decimalScrollRef}
              showsVerticalScrollIndicator={false}
              onScroll={handleDecimalScroll}
              scrollEventThrottle={16}
              snapToInterval={itemHeight}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingTop: centerOffset,
                paddingBottom: centerOffset,
              }}
              nestedScrollEnabled={true}
            >
              {decimalWeights.map((decimal, index) => (
                <View
                  key={decimal}
                  className="items-center justify-center"
                  style={{ height: itemHeight }}
                >
                  <Text
                    className={`text-lg ${
                      decimal === selectedDecimal
                        ? "font-bold text-black"
                        : "font-normal text-gray-600"
                    }`}
                    style={{
                      opacity: getItemOpacity(index, currentDecimalIndex),
                    }}
                  >
                    .{decimal}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Current Selection Display */}
        <View className="absolute bottom-4 left-0 right-0 items-center">
          <Text className="text-sm text-gray-500">Current Weight</Text>
          <Text className="text-xl font-bold text-green-600">
            {selectedWhole}.{selectedDecimal} kg
          </Text>
        </View>
      </View>
    </View>
  );
};

export default WeightSelectorOnboarding;

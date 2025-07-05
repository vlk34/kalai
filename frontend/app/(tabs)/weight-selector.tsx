"use client";
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSelectorContext } from "@/contexts/SelectorContext";

const WeightSelectorScreen = () => {
  const router = useRouter();
  const { currentValue, unit } = useLocalSearchParams();
  const { setSelectorData } = useSelectorContext();
  const wholeScrollRef = useRef<ScrollView>(null);
  const decimalScrollRef = useRef<ScrollView>(null);

  // Parse current weight into whole and decimal parts
  const parseWeight = (weightString: string) => {
    const weight = Number.parseFloat(weightString) || 70;
    const whole = Math.floor(weight);
    const decimal = Math.round((weight - whole) * 10); // Get first decimal place
    return { whole, decimal };
  };

  const initialWeight = parseWeight(currentValue as string);
  const [selectedWhole, setSelectedWhole] = useState(initialWeight.whole);
  const [selectedDecimal, setSelectedDecimal] = useState(initialWeight.decimal);

  const screenHeight = Dimensions.get("window").height;
  const itemHeight = 50;
  // Move center position higher up on screen
  const centerOffset = screenHeight / 2.5 - itemHeight / 2;

  // Generate whole number values based on unit
  const generateWholeWeights = () => {
    if (unit === "metric") {
      return Array.from({ length: 151 }, (_, i) => i + 30); // 30kg to 180kg
    } else {
      return Array.from({ length: 331 }, (_, i) => i + 66); // 66lbs to 396lbs
    }
  };

  // Generate decimal values (0.0 to 0.9)
  const generateDecimalWeights = () => {
    return Array.from({ length: 10 }, (_, i) => i); // 0, 1, 2, ..., 9 (representing 0.0, 0.1, 0.2, ..., 0.9)
  };

  const wholeWeights = generateWholeWeights();
  const decimalWeights = generateDecimalWeights();

  useEffect(() => {
    // Scroll to current values on mount
    setTimeout(() => {
      const wholeIndex = wholeWeights.indexOf(selectedWhole);
      const decimalIndex = selectedDecimal;

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
  }, []);

  const handleWholeScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const weight = wholeWeights[index];
    if (weight && weight !== selectedWhole) {
      setSelectedWhole(weight);
    }
  };

  const handleDecimalScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const decimal = decimalWeights[index];
    if (decimal !== undefined && decimal !== selectedDecimal) {
      setSelectedDecimal(decimal);
    }
  };

  const formatWholeWeight = (weight: number) => {
    if (unit === "metric") {
      return `${weight}`;
    } else {
      return `${weight}`;
    }
  };

  const formatDecimalWeight = (decimal: number) => {
    return `.${decimal}`;
  };

  const formatFullWeight = () => {
    const fullWeight = selectedWhole + selectedDecimal / 10;
    if (unit === "metric") {
      return `${fullWeight.toFixed(1)} kg`;
    } else {
      return `${fullWeight.toFixed(1)} lbs`;
    }
  };

  const handleSave = () => {
    // Calculate the full weight
    const fullWeight = selectedWhole + selectedDecimal / 10;
    // Set the selected weight in context
    setSelectorData({
      selectedWeight: fullWeight,
      weightUnit: unit as string,
    });
    // Navigate back
    router.back();
  };

  const getItemOpacity = (index: number, currentIndex: number) => {
    const distance = Math.abs(index - currentIndex);
    if (distance === 0) return 1; // Selected item
    if (distance === 1) return 0.7; // Adjacent items
    if (distance === 2) return 0.4; // Second adjacent items
    return 0.2; // Far items (faded)
  };

  const currentWholeIndex = wholeWeights.indexOf(selectedWhole);
  const currentDecimalIndex = selectedDecimal;

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-6 border-b border-gray-100 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Weight</Text>
        </View>

        {/* Selection Area */}
        <View className="flex-1 relative">
          {/* Center Selection Indicator Lines (transparent center) */}
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
              >
                {wholeWeights.map((weight, index) => (
                  <View
                    key={weight}
                    className="items-center justify-center"
                    style={{ height: itemHeight }}
                  >
                    <Text
                      className={`text-2xl ${
                        weight === selectedWhole
                          ? "font-bold text-black"
                          : "font-normal text-gray-600"
                      }`}
                      style={{
                        opacity: getItemOpacity(index, currentWholeIndex),
                      }}
                    >
                      {formatWholeWeight(weight)}
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
              >
                {decimalWeights.map((decimal, index) => (
                  <View
                    key={decimal}
                    className="items-center justify-center"
                    style={{ height: itemHeight }}
                  >
                    <Text
                      className={`text-2xl ${
                        decimal === selectedDecimal
                          ? "font-bold text-black"
                          : "font-normal text-gray-600"
                      }`}
                      style={{
                        opacity: getItemOpacity(index, currentDecimalIndex),
                      }}
                    >
                      {formatDecimalWeight(decimal)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Current Selection Display */}
          <View className="absolute bottom-24 left-0 right-0 items-center">
            <View className="bg-black/80 rounded-2xl px-6 py-3">
              <Text className="text-white font-semibold text-lg">
                {formatFullWeight()}
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View className="px-6 py-8">
          <TouchableOpacity
            onPress={handleSave}
            className="bg-black rounded-2xl py-4 flex-row items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default WeightSelectorScreen;

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

const HeightSelectorScreen = () => {
  const router = useRouter();
  const { currentValue, unit } = useLocalSearchParams();
  const { setSelectorData } = useSelectorContext();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedHeight, setSelectedHeight] = useState(
    Number.parseInt(currentValue as string) || 170
  );

  const screenHeight = Dimensions.get("window").height;
  const itemHeight = 50;
  // Move center position higher up on screen (was screenHeight / 2, now screenHeight / 2.5)
  const centerOffset = screenHeight / 2.5 - itemHeight / 2;

  // Generate height values based on unit
  const generateHeights = () => {
    if (unit === "metric") {
      return Array.from({ length: 121 }, (_, i) => i + 100); // 100cm to 220cm
    } else {
      return Array.from({ length: 49 }, (_, i) => i + 48); // 4'0" to 8'0" (in inches)
    }
  };

  const heights = generateHeights();

  useEffect(() => {
    // Scroll to current value on mount
    const index = heights.indexOf(selectedHeight);
    if (index !== -1) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: index * itemHeight,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const height = heights[index];
    if (height && height !== selectedHeight) {
      setSelectedHeight(height);
    }
  };

  const formatHeight = (height: number) => {
    if (unit === "metric") {
      return `${height} cm`;
    } else {
      const feet = Math.floor(height / 12);
      const inches = height % 12;
      return `${feet}'${inches}"`;
    }
  };

  const handleSave = () => {
    // Set the selected height in context
    setSelectorData({
      selectedHeight: selectedHeight,
      heightUnit: unit as string,
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

  const currentIndex = heights.indexOf(selectedHeight);

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-6 border-b border-gray-100 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Height</Text>
        </View>

        {/* Selection Area */}
        <View className="flex-1 relative">
          {/* Scroll View */}
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
          >
            {heights.map((height, index) => (
              <View
                key={height}
                className="items-center justify-center"
                style={{ height: itemHeight }}
              >
                <Text
                  className={`text-2xl ${
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

          {/* Center Selection Indicator Lines (transparent center) */}
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

export default HeightSelectorScreen;

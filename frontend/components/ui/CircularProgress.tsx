import React, { useRef, useEffect } from "react";
import { View, Text } from "react-native";
import { Flame } from "lucide-react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  isLoading?: boolean;
  hasBeenLoaded?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = React.memo(
  ({
    percentage,
    size = 80,
    strokeWidth = 6,
    isLoading = false,
    hasBeenLoaded = false,
  }) => {
    // Balanced animation duration:
    // - No animation when loading
    // - Reasonable duration for smooth but not laggy animations
    const animationDuration = isLoading ? 0 : hasBeenLoaded ? 300 : 500;

    return (
      <View
        className="items-center justify-center"
        style={{ width: size, height: size }}
      >
        <AnimatedCircularProgress
          size={size}
          width={strokeWidth}
          fill={isLoading ? 0 : percentage}
          tintColor="#f97316" // Orange progress color
          backgroundColor="#f1f5f9" // Light gray background
          lineCap="round"
          duration={animationDuration}
          rotation={0}
        >
          {() => (
            <View className="absolute items-center justify-center">
              <View className="bg-gray-50 rounded-full p-2 mb-1">
                <Flame size={16} color="#f97316" fill="#f97316" />
              </View>
              <Text className="text-xs font-bold text-gray-700">
                {isLoading ? "--" : `${Math.round(percentage)}%`}
              </Text>
            </View>
          )}
        </AnimatedCircularProgress>
      </View>
    );
  }
);

CircularProgress.displayName = "CircularProgress";

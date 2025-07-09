import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, Animated } from "react-native";
import { Dumbbell, Wheat, Droplet } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";

// Props interface for the MacrosSection component
interface MacrosSectionProps {
  dailyStats: {
    proteinLeft: number;
    totalProtein: number;
    carbsLeft: number;
    totalCarbs: number;
    fatsLeft: number;
    totalFats: number;
    proteinConsumed: number;
    carbsConsumed: number;
    fatsConsumed: number;
    isOverProteinGoal: boolean;
    isOverCarbsGoal: boolean;
    isOverFatsGoal: boolean;
  };
  isLoadingNutrition: boolean;
  nutritionError: any;
}

// Enhanced CircularProgress component for macros
interface MacroCircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  icon: React.ReactNode;
}

const MacroCircularProgress: React.FC<MacroCircularProgressProps> = ({
  percentage,
  size = 60,
  strokeWidth = 5,
  color,
  icon,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const circleData = useMemo(() => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    return { radius, circumference };
  }, [size, strokeWidth]);

  // Animate when percentage changes
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 500, // Reduced for better performance
      useNativeDriver: false, // SVG requires JS thread
    }).start();
  }, [percentage]);

  // Create animated stroke dash offset
  const animatedStrokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circleData.circumference, 0],
    extrapolate: "clamp",
  });

  // Create animated component
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={circleData.radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={circleData.radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circleData.circumference}
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Center content with icon */}
      <View className="absolute items-center justify-center">
        <View className="bg-gray-50 rounded-full p-1.5">{icon}</View>
      </View>
    </View>
  );
};

// Main MacrosSection component
export const MacrosSection: React.FC<MacrosSectionProps> = ({
  dailyStats,
  isLoadingNutrition,
  nutritionError,
}) => {
  // Calculate progress percentages
  const proteinProgress =
    dailyStats.totalProtein > 0
      ? Math.min(
          100,
          (dailyStats.proteinConsumed / dailyStats.totalProtein) * 100
        )
      : 0;

  const carbsProgress =
    dailyStats.totalCarbs > 0
      ? Math.min(100, (dailyStats.carbsConsumed / dailyStats.totalCarbs) * 100)
      : 0;

  const fatsProgress =
    dailyStats.totalFats > 0
      ? Math.min(100, (dailyStats.fatsConsumed / dailyStats.totalFats) * 100)
      : 0;

  return (
    <View className="flex-row gap-2 space-x-4 mb-4">
      {/* Protein Card */}
      <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
        {isLoadingNutrition ? (
          <>
            <Text className="text-xl font-bold text-gray-400 mb-2">--</Text>
            <Text className="text-xs text-gray-500 mb-2 text-center">
              Protein Left
            </Text>
            <View className="w-15 h-15 bg-gray-100 rounded-full" />
          </>
        ) : nutritionError ? (
          <>
            <Text className="text-xl font-bold text-gray-400 mb-2">--</Text>
            <Text className="text-xs text-gray-500 mb-2 text-center">
              Protein Left
            </Text>
            <View className="w-15 h-15 bg-gray-100 rounded-full" />
          </>
        ) : (
          <>
            <Text className="text-xl font-semibold text-black-600">
              {Math.round(dailyStats.proteinLeft)}g
            </Text>
            <Text className="text-xs text-gray-500 mb-2 text-center">
              {dailyStats.isOverProteinGoal ? "Protein Eaten" : "Protein Left"}
            </Text>
            <MacroCircularProgress
              percentage={proteinProgress}
              color="#e11d48"
              icon={<Dumbbell size={14} color="#e11d48" />}
            />
            <Text className="text-xs text-gray-400 mt-2">
              {dailyStats.isOverProteinGoal ? "Goal: " : "of "}
              {Math.round(dailyStats.totalProtein)}g
            </Text>
          </>
        )}
      </View>

      {/* Carbs Card */}
      <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
        {isLoadingNutrition ? (
          <>
            <Text className="text-xl font-semibold text-gray-400 mb-2">--</Text>
            <Text className="text-xs text-gray-500 mb-2 text-center">
              Carbs Left
            </Text>
            <View className="w-15 h-15 bg-gray-100 rounded-full" />
          </>
        ) : nutritionError ? (
          <>
            <Text className="text-xl font-semibold text-gray-400 mb-2">--</Text>
            <Text className="text-xs text-gray-500 mb-2 text-center">
              Carbs Left
            </Text>
            <View className="w-15 h-15 bg-gray-100 rounded-full" />
          </>
        ) : (
          <>
            <Text className="text-xl font-bold text-black-600">
              {Math.round(dailyStats.carbsLeft)}g
            </Text>
            <Text className="text-xs text-gray-500 mb-2 text-center">
              {dailyStats.isOverCarbsGoal ? "Carbs Eaten" : "Carbs Left"}
            </Text>
            <MacroCircularProgress
              percentage={carbsProgress}
              color="#ea580c"
              icon={<Wheat size={14} color="#ea580c" />}
            />
            <Text className="text-xs text-gray-400 mt-2">
              {dailyStats.isOverCarbsGoal ? "Goal: " : "of "}
              {Math.round(dailyStats.totalCarbs)}g
            </Text>
          </>
        )}
      </View>

      {/* Fats Card */}
      <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
        {isLoadingNutrition ? (
          <>
            <Text className="text-xl font-semibold text-gray-400 mb-2">--</Text>
            <Text className="text-xs text-gray-500 mb-2 text-center">
              Fats Left
            </Text>
            <View className="w-15 h-15 bg-gray-100 rounded-full" />
          </>
        ) : nutritionError ? (
          <>
            <Text className="text-xl font-semibold text-gray-400 mb-2">--</Text>
            <Text className="text-xs text-gray-500 mb-2 text-center">
              Fats Left
            </Text>
            <View className="w-15 h-15 bg-gray-100 rounded-full" />
          </>
        ) : (
          <>
            <Text className="text-xl font-bold text-black-600">
              {Math.round(dailyStats.fatsLeft)}g
            </Text>
            <Text className="text-xs text-gray-500 mb-2 text-center">
              {dailyStats.isOverFatsGoal ? "Fats Eaten" : "Fats Left"}
            </Text>
            <MacroCircularProgress
              percentage={fatsProgress}
              color="#0284c7"
              icon={<Droplet size={14} color="#0284c7" />}
            />
            <Text className="text-xs text-gray-400 mt-2">
              {dailyStats.isOverFatsGoal ? "Goal: " : "of "}
              {Math.round(dailyStats.totalFats)}g
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

import React from "react";
import { View, Text } from "react-native";
import { Dumbbell, Wheat, Droplet } from "lucide-react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";

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
  hasBeenLoaded?: boolean;
}

// Enhanced CircularProgress component for macros
interface MacroCircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  animationDelay?: number;
  hasBeenLoaded?: boolean;
}

const MacroCircularProgress: React.FC<MacroCircularProgressProps> = React.memo(
  ({
    percentage,
    size = 60,
    strokeWidth = 5,
    color,
    icon,
    isLoading = false,
    animationDelay = 0,
    hasBeenLoaded = false,
  }) => {
    // Balanced animation duration:
    // - No animation when loading
    // - Reasonable duration for smooth but not laggy animations
    const animationDuration = isLoading ? 0 : hasBeenLoaded ? 250 : 400;

    return (
      <View
        className="items-center justify-center"
        style={{ width: size, height: size }}
      >
        <AnimatedCircularProgress
          size={size}
          width={strokeWidth}
          fill={isLoading ? 0 : percentage}
          tintColor={color}
          backgroundColor="#f1f5f9" // Light gray background
          lineCap="round"
          duration={animationDuration}
          delay={isLoading ? 0 : animationDelay}
          rotation={0}
        >
          {() => (
            <View className="absolute items-center justify-center">
              <View className="bg-gray-50 rounded-full p-1.5">{icon}</View>
            </View>
          )}
        </AnimatedCircularProgress>
      </View>
    );
  }
);

// Main MacrosSection component
export const MacrosSection: React.FC<MacrosSectionProps> = React.memo(
  ({
    dailyStats,
    isLoadingNutrition,
    nutritionError,
    hasBeenLoaded = false,
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
        ? Math.min(
            100,
            (dailyStats.carbsConsumed / dailyStats.totalCarbs) * 100
          )
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
                {dailyStats.isOverProteinGoal
                  ? "Protein Eaten"
                  : "Protein Left"}
              </Text>
              <MacroCircularProgress
                percentage={proteinProgress}
                color="#e11d48"
                icon={<Dumbbell size={14} color="#e11d48" />}
                isLoading={isLoadingNutrition}
                animationDelay={0}
                hasBeenLoaded={hasBeenLoaded}
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
              <Text className="text-xl font-semibold text-gray-400 mb-2">
                --
              </Text>
              <Text className="text-xs text-gray-500 mb-2 text-center">
                Carbs Left
              </Text>
              <View className="w-15 h-15 bg-gray-100 rounded-full" />
            </>
          ) : nutritionError ? (
            <>
              <Text className="text-xl font-semibold text-gray-400 mb-2">
                --
              </Text>
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
                isLoading={isLoadingNutrition}
                animationDelay={50}
                hasBeenLoaded={hasBeenLoaded}
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
              <Text className="text-xl font-semibold text-gray-400 mb-2">
                --
              </Text>
              <Text className="text-xs text-gray-500 mb-2 text-center">
                Fats Left
              </Text>
              <View className="w-15 h-15 bg-gray-100 rounded-full" />
            </>
          ) : nutritionError ? (
            <>
              <Text className="text-xl font-semibold text-gray-400 mb-2">
                --
              </Text>
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
                isLoading={isLoadingNutrition}
                animationDelay={100}
                hasBeenLoaded={hasBeenLoaded}
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
  }
);

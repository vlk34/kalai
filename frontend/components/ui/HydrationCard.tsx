import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Droplets, Minus, Plus } from "lucide-react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import {
  HYDRATION_GLASS_ML,
  formatHydrationLiters,
} from "@/utils/hydration";

export type HydrationCardProps = {
  intakeMl: number;
  goalMl: number;
  progressPercent: number;
  isLoading?: boolean;
  isSaving?: boolean;
  onAddGlass: () => void;
  onRemoveGlass: () => void;
};

export const HydrationCard: React.FC<HydrationCardProps> = React.memo(
  ({
    intakeMl,
    goalMl,
    progressPercent,
    isLoading = false,
    isSaving = false,
    onAddGlass,
    onRemoveGlass,
  }) => {
    const disabled = isLoading || isSaving;
    const remainingMl = Math.max(0, goalMl - intakeMl);
    const goalReached = intakeMl >= goalMl;

    return (
      <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="bg-sky-50 rounded-full p-2 mr-3">
              <Droplets size={18} color="#0284c7" />
            </View>
            <View>
              <Text className="text-base font-semibold text-gray-900">
                Hydration
              </Text>
              <Text className="text-xs text-gray-500">
                {HYDRATION_GLASS_ML}ml per glass
              </Text>
            </View>
          </View>
          {isSaving ? (
            <ActivityIndicator size="small" color="#0284c7" />
          ) : null}
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            {isLoading ? (
              <Text className="text-3xl font-bold text-gray-300">--</Text>
            ) : (
              <Text className="text-3xl font-bold text-gray-900">
                {formatHydrationLiters(intakeMl)}
              </Text>
            )}
            <Text className="text-sm text-gray-500 mt-1">
              {isLoading
                ? "Loading water intake..."
                : goalReached
                  ? "Daily water goal reached"
                  : `${formatHydrationLiters(remainingMl)} left of ${formatHydrationLiters(goalMl)}`}
            </Text>

            <View className="flex-row items-center mt-4 gap-3">
              <TouchableOpacity
                onPress={onRemoveGlass}
                disabled={disabled || intakeMl <= 0}
                accessibilityRole="button"
                accessibilityLabel="Remove one glass of water"
                className={`w-11 h-11 rounded-full items-center justify-center border ${
                  disabled || intakeMl <= 0
                    ? "border-gray-100 bg-gray-50"
                    : "border-sky-100 bg-sky-50"
                }`}
              >
                <Minus
                  size={18}
                  color={disabled || intakeMl <= 0 ? "#9ca3af" : "#0284c7"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onAddGlass}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel="Add one glass of water"
                className={`px-4 h-11 rounded-full flex-row items-center ${
                  disabled ? "bg-sky-200" : "bg-sky-500"
                }`}
              >
                <Plus size={16} color="white" />
                <Text className="text-white font-semibold ml-2">Add glass</Text>
              </TouchableOpacity>
            </View>
          </View>

          <AnimatedCircularProgress
            size={84}
            width={8}
            fill={isLoading ? 0 : progressPercent}
            tintColor="#0284c7"
            backgroundColor="#e0f2fe"
            lineCap="round"
            rotation={0}
            duration={isLoading ? 0 : 350}
          >
            {() => (
              <Text className="text-sm font-semibold text-sky-700">
                {isLoading ? "--" : `${progressPercent}%`}
              </Text>
            )}
          </AnimatedCircularProgress>
        </View>
      </View>
    );
  }
);

HydrationCard.displayName = "HydrationCard";

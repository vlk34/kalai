import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const [caloriesConsumed, setCaloriesConsumed] = useState(1450);
  const [calorieGoal] = useState(2200);
  const [remainingCalories, setRemainingCalories] = useState(
    calorieGoal - caloriesConsumed
  );

  const progressPercentage = (caloriesConsumed / calorieGoal) * 100;

  const macros = {
    carbs: { consumed: 145, goal: 275 },
    protein: { consumed: 85, goal: 165 },
    fat: { consumed: 48, goal: 73 },
  };

  const recentMeals = [
    { name: "Breakfast Bowl", calories: 420, time: "8:30 AM" },
    { name: "Grilled Chicken Salad", calories: 580, time: "12:45 PM" },
    { name: "Protein Smoothie", calories: 280, time: "3:15 PM" },
    { name: "Salmon & Quinoa", calories: 170, time: "7:20 PM" },
  ];

  return (
    <SafeAreaView
      className={`flex-1 ${
        colorScheme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <ScrollView className="flex-1 px-4 pt-6">
        {/* Header */}
        <View className="mb-8">
          <Text
            className={`text-3xl font-bold mb-2 ${
              colorScheme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Hello Volkan! 👋
          </Text>
          <Text
            className={`text-lg ${
              colorScheme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Let's track your nutrition today
          </Text>
        </View>

        {/* Calorie Progress Card */}
        <View
          className={`rounded-3xl p-6 mb-6 ${
            colorScheme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}
        >
          <Text
            className={`text-xl font-bold mb-4 ${
              colorScheme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Daily Calories
          </Text>

          {/* Circular Progress */}
          <View className="items-center mb-6">
            <View className="relative">
              <View
                className={`w-40 h-40 rounded-full border-8 ${
                  colorScheme === "dark" ? "border-gray-700" : "border-gray-200"
                } items-center justify-center`}
              >
                <View
                  className="absolute w-40 h-40 rounded-full border-8 border-primary -rotate-90"
                  style={{
                    borderColor:
                      progressPercentage > 100 ? "#DC2626" : "#10B981",
                    borderTopColor: "transparent",
                    borderRightColor:
                      progressPercentage < 25
                        ? "transparent"
                        : progressPercentage > 100
                          ? "#DC2626"
                          : "#10B981",
                    borderBottomColor:
                      progressPercentage < 50
                        ? "transparent"
                        : progressPercentage > 100
                          ? "#DC2626"
                          : "#10B981",
                    borderLeftColor:
                      progressPercentage < 75
                        ? "transparent"
                        : progressPercentage > 100
                          ? "#DC2626"
                          : "#10B981",
                  }}
                />
                <View className="items-center">
                  <Text
                    className={`text-3xl font-bold ${
                      colorScheme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {caloriesConsumed}
                  </Text>
                  <Text
                    className={`text-sm ${
                      colorScheme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    of {calorieGoal}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row mt-4 space-x-8">
              <View className="items-center">
                <Text
                  className={`text-lg font-semibold ${
                    remainingCalories >= 0 ? "text-primary" : "text-red-500"
                  }`}
                >
                  {Math.abs(remainingCalories)}
                </Text>
                <Text
                  className={`text-xs ${
                    colorScheme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {remainingCalories >= 0 ? "Remaining" : "Over"}
                </Text>
              </View>
              <View className="items-center">
                <Text
                  className={`text-lg font-semibold ${
                    colorScheme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {Math.round(progressPercentage)}%
                </Text>
                <Text
                  className={`text-xs ${
                    colorScheme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Progress
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Macros Card */}
        <View
          className={`rounded-3xl p-6 mb-6 ${
            colorScheme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}
        >
          <Text
            className={`text-xl font-bold mb-4 ${
              colorScheme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Macronutrients
          </Text>

          {Object.entries(macros).map(([key, macro]) => {
            const percentage = (macro.consumed / macro.goal) * 100;
            return (
              <View key={key} className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text
                    className={`font-semibold capitalize ${
                      colorScheme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {key}
                  </Text>
                  <Text
                    className={`${
                      colorScheme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {macro.consumed}g / {macro.goal}g
                  </Text>
                </View>
                <View
                  className={`h-2 rounded-full ${
                    colorScheme === "dark" ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <View
                    className={`h-2 rounded-full ${
                      key === "carbs"
                        ? "bg-blue-500"
                        : key === "protein"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Meals */}
        <View
          className={`rounded-3xl p-6 mb-6 ${
            colorScheme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}
        >
          <Text
            className={`text-xl font-bold mb-4 ${
              colorScheme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Recent Meals
          </Text>

          {recentMeals.map((meal, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700"
            >
              <View className="flex-1">
                <Text
                  className={`font-semibold ${
                    colorScheme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {meal.name}
                </Text>
                <Text
                  className={`text-sm ${
                    colorScheme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {meal.time}
                </Text>
              </View>
              <Text
                className={`font-bold ${
                  colorScheme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {meal.calories} cal
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View
          className={`rounded-3xl p-6 mb-20 ${
            colorScheme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}
        >
          <Text
            className={`text-xl font-bold mb-4 ${
              colorScheme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Quick Actions
          </Text>

          <View className="flex-row space-x-4">
            <TouchableOpacity
              className="flex-1 bg-primary rounded-2xl p-4 items-center"
              onPress={() => router.push("/(tabs)/camera")}
            >
              <IconSymbol name="camera.fill" size={24} color="white" />
              <Text className="text-white font-semibold mt-2">Add Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 rounded-2xl p-4 items-center ${
                colorScheme === "dark" ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <IconSymbol
                name="plus.circle.fill"
                size={24}
                color={colorScheme === "dark" ? "white" : "black"}
              />
              <Text
                className={`font-semibold mt-2 ${
                  colorScheme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

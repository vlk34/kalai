"use client";

import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const [selectedDay, setSelectedDay] = useState("Today");

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const streak = 12;

  // Sample data for selected day
  const dailyStats = {
    caloriesLeft: 750,
    totalCalories: 2200,
    proteinLeft: 45,
    totalProtein: 165,
    carbsLeft: 130,
    totalCarbs: 275,
    fatsLeft: 25,
    totalFats: 73,
  };

  const caloriesConsumed = dailyStats.totalCalories - dailyStats.caloriesLeft;
  const progressPercentage =
    (caloriesConsumed / dailyStats.totalCalories) * 100;

  const recentMeals = [
    { name: "Avocado Toast", calories: 320, time: "8:30 AM", image: "🥑" },
    { name: "Greek Salad", calories: 280, time: "12:45 PM", image: "🥗" },
    { name: "Protein Smoothie", calories: 180, time: "3:15 PM", image: "🥤" },
  ];

  const openCamera = () => {
    router.push("/camera");
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#ffffff", "#f8fafc", "#f1f5f9"]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          {/* Top Bar */}
          <View className="flex-row justify-between items-center px-6 py-4">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">🍎</Text>
              <Text className="text-xl font-bold text-gray-900">Kal AI</Text>
            </View>

            <View className="flex-row items-center bg-white rounded-full px-4 py-2 shadow-sm">
              <Text className="text-xl mr-2">🔥</Text>
              <Text className="text-lg font-bold text-orange-500">
                {streak}
              </Text>
            </View>
          </View>

          {/* Days Header */}
          <View className="px-6 mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-4">
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    className={`px-4 py-2 rounded-full ${
                      selectedDay === day ||
                      (day === "Today" && selectedDay === "Today")
                        ? "bg-green-500"
                        : "bg-white"
                    } shadow-sm`}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedDay === day ||
                        (day === "Today" && selectedDay === "Today")
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Calories Section */}
            <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    Calories Left
                  </Text>
                  <Text className="text-3xl font-bold text-green-500">
                    {dailyStats.caloriesLeft}
                  </Text>
                </View>

                <View className="items-center">
                  <View className="relative w-20 h-20">
                    <View className="absolute w-20 h-20 rounded-full border-4 border-gray-200" />
                    <View
                      className="absolute w-20 h-20 rounded-full border-4 border-green-500 -rotate-90"
                      style={{
                        borderTopColor: "transparent",
                        borderRightColor:
                          progressPercentage >= 25 ? "#10b981" : "transparent",
                        borderBottomColor:
                          progressPercentage >= 50 ? "#10b981" : "transparent",
                        borderLeftColor:
                          progressPercentage >= 75 ? "#10b981" : "transparent",
                      }}
                    />
                    <View className="absolute inset-0 items-center justify-center">
                      <Text className="text-xs font-bold text-gray-700">
                        {Math.round(progressPercentage)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Macros Section */}
            <View className="flex-row gap-1 space-x-4 mb-6">
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Protein Left
                </Text>
                <Text className="text-xl font-bold text-blue-500">
                  {dailyStats.proteinLeft}g
                </Text>
                <Text className="text-xs text-gray-400">
                  of {dailyStats.totalProtein}g
                </Text>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Carbs Left
                </Text>
                <Text className="text-xl font-bold text-orange-500">
                  {dailyStats.carbsLeft}g
                </Text>
                <Text className="text-xs text-gray-400">
                  of {dailyStats.totalCarbs}g
                </Text>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Fats Left
                </Text>
                <Text className="text-xl font-bold text-purple-500">
                  {dailyStats.fatsLeft}g
                </Text>
                <Text className="text-xs text-gray-400">
                  of {dailyStats.totalFats}g
                </Text>
              </View>
            </View>

            {/* Recently Eaten */}
            <View className="bg-white rounded-3xl p-6 mb-20 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Recently Eaten
              </Text>

              {recentMeals.length > 0 ? (
                recentMeals.map((meal, index) => (
                  <View
                    key={index}
                    className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <Text className="text-2xl mr-3">{meal.image}</Text>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">
                        {meal.name}
                      </Text>
                      <Text className="text-sm text-gray-500">{meal.time}</Text>
                    </View>
                    <Text className="font-bold text-gray-900">
                      {meal.calories} cal
                    </Text>
                  </View>
                ))
              ) : (
                <View className="items-center py-8">
                  <Text className="text-gray-500 text-center mb-2">
                    You haven't uploaded any food yet
                  </Text>
                  <Text className="text-gray-400 text-center text-sm">
                    Start by taking a photo of your meal!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Camera Button */}
          <TouchableOpacity
            onPress={openCamera}
            className="absolute bottom-44 right-6 bg-black rounded-full w-14 h-14 items-center justify-center shadow-lg"
          >
            <IconSymbol name="camera.fill" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

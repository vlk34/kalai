"use client";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRecentMeals } from "@/hooks/useRecentMeals";
import { useMutateRecentMeals } from "@/hooks/useMutateRecentMeals";
import {
  useDailyNutritionSummary,
  getDateForDayOfWeek,
  formatDateForAPI,
} from "@/hooks/useUserProfile";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { useQueryClient } from "@tanstack/react-query";

export default function DashboardScreen() {
  // Initialize with today's date
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateForAPI(new Date())
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    new Date().getDay()
  );
  const queryClient = useQueryClient();

  // Use TanStack Query hooks for recent meals and user profile
  const {
    data: recentMeals = [],
    isLoading: isLoadingMeals,
    error,
  } = useRecentMeals(selectedDate);
  const { invalidateRecentMeals } = useMutateRecentMeals();

  // Use the new daily nutrition summary hook
  const {
    data: dailyNutrition,
    isLoading: isLoadingNutrition,
    error: nutritionError,
  } = useDailyNutritionSummary(selectedDate);

  // Use the streak context instead of local state
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streak, setStreak] = useState(0);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Handle day selection
  const handleDaySelect = (dayIndex: number) => {
    const dateForDay = getDateForDayOfWeek(dayIndex);
    setSelectedDate(dateForDay);
    setSelectedDayIndex(dayIndex);
  };

  // Function to format time from ISO string to HH:MM format
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      return "Unknown";
    }
  };

  // Handle meal item click to navigate to edit page
  const handleMealPress = (meal: any) => {
    router.push({
      pathname: `/(tabs)/${meal.id}` as any,
      params: {
        id: meal.id,
        name: meal.name,
        photo_url: meal.photo_url,
        calories: meal.calories.toString(),
        protein: meal.protein.toString(),
        carbs: meal.carbs.toString(),
        fats: meal.fats.toString(),
        portions: "1", // Default portions
      },
    });
  };

  // Refresh data when screen comes into focus (e.g., returning from camera)
  useFocusEffect(
    useCallback(() => {
      // Only invalidate nutrition data for the current selected date
      queryClient.invalidateQueries({
        queryKey: ["daily-nutrition-summary", undefined, selectedDate],
      });
    }, [queryClient, selectedDate])
  );

  // Calculate daily stats from daily nutrition summary or fallback to defaults
  const getDailyStats = () => {
    // Default values if data not loaded yet
    const defaultStats = {
      caloriesLeft: 0,
      totalCalories: 0,
      proteinLeft: 0,
      totalProtein: 0,
      carbsLeft: 0,
      totalCarbs: 0,
      fatsLeft: 0,
      totalFats: 0,
    };

    // If nutrition data is available, use it
    if (dailyNutrition) {
      console.log("Getting values from daily nutrition summary");
      return {
        caloriesLeft: Math.max(0, dailyNutrition.remaining_to_goal.calories),
        totalCalories: dailyNutrition.daily_goals.calories,
        proteinLeft: Math.max(0, dailyNutrition.remaining_to_goal.protein),
        totalProtein: dailyNutrition.daily_goals.protein,
        carbsLeft: Math.max(0, dailyNutrition.remaining_to_goal.carbs),
        totalCarbs: dailyNutrition.daily_goals.carbs,
        fatsLeft: Math.max(0, dailyNutrition.remaining_to_goal.fats),
        totalFats: dailyNutrition.daily_goals.fats,
      };
    }

    return defaultStats;
  };

  const dailyStats = getDailyStats();
  const caloriesConsumed = dailyStats.totalCalories - dailyStats.caloriesLeft;
  const progressPercentage =
    (caloriesConsumed / dailyStats.totalCalories) * 100;

  const openCamera = () => {
    router.push("/camera");
  };

  const navigateToSettings = () => {
    router.push("/settings");
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#fafafa", "#f4f6f8", "#eef2f5"]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          {/* Top Bar */}
          <View className="flex-row justify-between items-center px-6 py-4">
            <View className="flex-row items-center justify-center gap-2">
              <FontAwesome5
                name="apple-alt"
                size={24}
                color="black"
                className="mb-1"
              />
              <Text className="text-xl font-bold text-gray-900">Kal AI</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => setShowStreakModal(true)}
                className="flex-row items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm"
              >
                <FontAwesome6 name="fire" size={24} color="orange" />
                <Text className="text-lg font-bold text-orange-600">
                  {streak} days
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={navigateToSettings}
                className="bg-white rounded-full p-2 shadow-sm"
              >
                <MaterialIcons name="settings" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Days Header */}
          <View className="px-6 mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-4">
                {days.map((day, index) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => handleDaySelect(index)}
                    className={`px-4 py-2 rounded-full ${
                      selectedDayIndex === index ? "bg-black" : "bg-white"
                    } shadow-sm`}
                  >
                    <Text
                      className={`font-semibold ${selectedDayIndex === index ? "text-white" : "text-gray-700"}`}
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
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center">
                <View>
                  {isLoadingNutrition ? (
                    <Text className="text-xl pl-2 text-gray-400">
                      Loading...
                    </Text>
                  ) : nutritionError ? (
                    <View>
                      <Text className="text-5xl font-bold text-gray-400 py-2">
                        --
                      </Text>
                      <Text className="text-sm text-gray-500 mb-1 pl-2">
                        No data available
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <Text className="text-5xl font-bold text-black-600 py-2">
                        {Math.round(dailyStats.caloriesLeft)}
                      </Text>
                      <Text className="text-sm text-gray-800 mb-1 pl-2">
                        Calories Left
                      </Text>
                    </View>
                  )}
                </View>
                <CircularProgress
                  percentage={
                    dailyStats.totalCalories > 0 ? progressPercentage : 0
                  }
                />
              </View>
            </View>

            {/* Macros Section */}
            <View className="flex-row gap-2 space-x-4  mb-4">
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Protein Left
                </Text>
                {isLoadingNutrition ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : nutritionError ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : (
                  <Text className="text-xl font-bold text-rose-600">
                    {Math.round(dailyStats.proteinLeft)}g
                  </Text>
                )}
                <Text className="text-xs text-gray-400">
                  of {Math.round(dailyStats.totalProtein)}g
                </Text>
              </View>
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Carbs Left
                </Text>
                {isLoadingNutrition ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : nutritionError ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : (
                  <Text className="text-xl font-bold text-orange-600">
                    {Math.round(dailyStats.carbsLeft)}g
                  </Text>
                )}
                <Text className="text-xs text-gray-400">
                  of {Math.round(dailyStats.totalCarbs)}g
                </Text>
              </View>
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Fats Left
                </Text>
                {isLoadingNutrition ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : nutritionError ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : (
                  <Text className="text-xl font-bold text-sky-600">
                    {Math.round(dailyStats.fatsLeft)}g
                  </Text>
                )}
                <Text className="text-xs text-gray-400">
                  of {Math.round(dailyStats.totalFats)}g
                </Text>
              </View>
            </View>

            {/* Recently Section */}
            <View className="mb-20">
              <Text className="text-lg font-semibold text-gray-900 mb-4 px-2">
                Recently
              </Text>
              {isLoadingMeals ? (
                <View className="bg-white rounded-2xl p-6 shadow-sm">
                  <Text className="text-gray-500 text-center">
                    Loading your recent meals...
                  </Text>
                </View>
              ) : error ? (
                <View className="bg-white rounded-2xl p-6 shadow-sm">
                  <Text className="text-red-500 text-center mb-2">
                    Failed to load recent meals
                  </Text>
                  <TouchableOpacity
                    onPress={() => invalidateRecentMeals()}
                    className="bg-green-500 rounded-lg px-4 py-2"
                  >
                    <Text className="text-white font-medium text-center">
                      Retry
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : recentMeals.length > 0 ? (
                <View className="space-y-3 gap-3">
                  {recentMeals.map((meal) => (
                    <TouchableOpacity
                      key={meal.id}
                      onPress={() => handleMealPress(meal)}
                      className="bg-white rounded-2xl px-3 py-2 shadow-sm"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center">
                        <View className="relative">
                          <Image
                            source={{ uri: meal.photo_url }}
                            className="w-20 h-20 rounded-xl mr-4"
                          />
                          {/* Loading overlay for meals being analyzed */}
                          {meal.isAnalyzing && (
                            <View className="absolute inset-0 bg-black/50 rounded-xl mr-4 justify-center items-center">
                              <ActivityIndicator size="small" color="white" />
                            </View>
                          )}
                        </View>
                        <View className="flex-1">
                          <View className="flex-row justify-between items-start">
                            <Text
                              className={`font-semibold text-base w-[70%] ${
                                meal.name === "Analyzing..."
                                  ? "text-gray-400 italic"
                                  : meal.name === "Analysis Failed"
                                    ? "text-red-500"
                                    : "text-gray-900"
                              }`}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {meal.name}
                            </Text>
                            <Text className="text-sm text-gray-500">
                              {formatTime(meal.created_at)}
                            </Text>
                          </View>
                          <Text
                            className={`text-md mb-2 ${
                              meal.name === "Analyzing..."
                                ? "text-gray-400 italic"
                                : meal.name === "Analysis Failed"
                                  ? "text-red-500"
                                  : "text-gray-600"
                            }`}
                          >
                            {meal.name === "Analyzing..."
                              ? "Analyzing..."
                              : meal.name === "Analysis Failed"
                                ? "Analysis failed"
                                : `${Math.round(meal.calories)} calories`}
                          </Text>
                          <View className="flex-row items-center">
                            <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                              <View className="bg-rose-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                                <Text className="text-xs font-medium text-rose-600">
                                  P
                                </Text>
                              </View>
                              <Text
                                className={`text-xs font-medium ${
                                  meal.name === "Analyzing..."
                                    ? "text-gray-400"
                                    : ""
                                }`}
                              >
                                {meal.name === "Analyzing..."
                                  ? "--"
                                  : `${Math.round(meal.protein)}g`}
                              </Text>
                            </View>
                            <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                              <View className="bg-sky-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                                <Text className="text-xs font-medium text-sky-600">
                                  F
                                </Text>
                              </View>
                              <Text
                                className={`text-xs font-medium ${
                                  meal.name === "Analyzing..."
                                    ? "text-gray-400"
                                    : ""
                                }`}
                              >
                                {meal.name === "Analyzing..."
                                  ? "--"
                                  : `${Math.round(meal.fats)}g`}
                              </Text>
                            </View>
                            <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                              <View className="bg-orange-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                                <Text className="text-xs font-medium text-orange-600">
                                  C
                                </Text>
                              </View>
                              <Text
                                className={`text-xs font-medium ${
                                  meal.name === "Analyzing..."
                                    ? "text-gray-400"
                                    : ""
                                }`}
                              >
                                {meal.name === "Analyzing..."
                                  ? "--"
                                  : `${Math.round(meal.carbs)}g`}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="bg-white rounded-2xl p-8 shadow-sm">
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

          {/* Streak Modal */}
          {showStreakModal && (
            <View className="absolute inset-0 bg-black/30 justify-center items-center z-50">
              <View className="bg-white rounded-3xl mx-6 p-8 items-center shadow-2xl">
                <View className="bg-orange-100 rounded-full p-6 mb-6">
                  <FontAwesome6 name="fire" size={48} color="orange" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
                  🔥 {streak} Day Streak!
                </Text>
                <Text className="text-lg text-gray-700 text-center mb-6 leading-6">
                  You're on fire! Keep reaching your daily calorie goals to
                  maintain your streak.
                </Text>
                <View className="flex-row gap-2 space-x-3 w-full">
                  <TouchableOpacity
                    onPress={() => setShowStreakModal(false)}
                    className="flex-1 bg-gray-100 rounded-2xl py-2"
                  >
                    <Text className="text-center font-semibold text-gray-700">
                      Close
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowStreakModal(false);
                      openCamera();
                    }}
                    className="flex-1 bg-green-500 rounded-2xl py-2"
                  >
                    <Text className="text-center font-semibold text-white">
                      Log Meal Now
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

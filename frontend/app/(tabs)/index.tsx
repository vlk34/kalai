"use client";

import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRecentMeals } from "@/hooks/useRecentMeals";
import { useMutateRecentMeals } from "@/hooks/useMutateRecentMeals";
import { useUserProfile } from "@/hooks/useUserProfile";
import { CircularProgress } from "@/components/ui/CircularProgress";

export default function DashboardScreen() {
  const [selectedDay, setSelectedDay] = useState("Today");

  // Use TanStack Query hooks for recent meals and user profile
  const {
    data: recentMeals = [],
    isLoading: isLoadingMeals,
    error,
  } = useRecentMeals();
  const { invalidateRecentMeals } = useMutateRecentMeals();

  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useUserProfile();

  // Use the streak context instead of local state
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streak, setStreak] = useState(0);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  // Refresh data when screen comes into focus (e.g., returning from camera)
  useFocusEffect(
    useCallback(() => {
      invalidateRecentMeals();
    }, [invalidateRecentMeals])
  );

  // Redirect to onboarding if no profile exists
  // useEffect(() => {
  //   if (!isLoadingProfile && !userProfile && !profileError) {
  //     // No profile found, redirect to onboarding
  //     router.push("/onboarding");
  //   }
  // }, [isLoadingProfile, userProfile, profileError]);

  // Calculate daily stats from user profile and consumed meals
  const getDailyStats = () => {
    // Default values if profile not loaded yet
    const defaultStats = {
      caloriesLeft: 750,
      totalCalories: 2200,
      proteinLeft: 45,
      totalProtein: 165,
      carbsLeft: 130,
      totalCarbs: 275,
      fatsLeft: 25,
      totalFats: 73,
    };

    if (!userProfile) return defaultStats;

    // Calculate consumed totals from recent meals (today's meals)
    const today = new Date().toDateString();
    const todaysMeals = recentMeals.filter(
      (meal) => new Date(meal.created_at).toDateString() === today
    );

    const consumedCalories = todaysMeals.reduce(
      (sum, meal) => sum + meal.calories,
      0
    );
    const consumedProtein = todaysMeals.reduce(
      (sum, meal) => sum + meal.protein,
      0
    );
    const consumedCarbs = todaysMeals.reduce(
      (sum, meal) => sum + meal.carbs,
      0
    );
    const consumedFats = todaysMeals.reduce((sum, meal) => sum + meal.fats, 0);

    return {
      caloriesLeft: Math.max(0, userProfile.daily_calories - consumedCalories),
      totalCalories: userProfile.daily_calories,
      proteinLeft: Math.max(0, userProfile.daily_protein_g - consumedProtein),
      totalProtein: userProfile.daily_protein_g,
      carbsLeft: Math.max(0, userProfile.daily_carbs_g - consumedCarbs),
      totalCarbs: userProfile.daily_carbs_g,
      fatsLeft: Math.max(0, userProfile.daily_fats_g - consumedFats),
      totalFats: userProfile.daily_fats_g,
    };
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
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center">
                <View>
                  {isLoadingProfile ? (
                    <Text className="text-xl pl-2 text-gray-400">
                      Loading...
                    </Text>
                  ) : (
                    <Text className="text-5xl font-bold text-black-600 p-2">
                      {Math.round(dailyStats.caloriesLeft)}
                    </Text>
                  )}
                  <Text className="text-sm text-gray-800 mb-1 pl-2">
                    Calories Left
                  </Text>
                </View>

                <CircularProgress percentage={progressPercentage} />
              </View>
            </View>

            {/* Macros Section */}
            <View className="flex-row gap-2 space-x-4  mb-4">
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Protein Left
                </Text>
                <Text className="text-xl font-bold text-rose-600">
                  {Math.round(dailyStats.proteinLeft)}g
                </Text>
                <Text className="text-xs text-gray-400">
                  of {Math.round(dailyStats.totalProtein)}g
                </Text>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Carbs Left
                </Text>
                <Text className="text-xl font-bold text-orange-600">
                  {Math.round(dailyStats.carbsLeft)}g
                </Text>
                <Text className="text-xs text-gray-400">
                  of {Math.round(dailyStats.totalCarbs)}g
                </Text>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Fats Left
                </Text>
                <Text className="text-xl font-bold text-sky-600">
                  {Math.round(dailyStats.fatsLeft)}g
                </Text>
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
                    onPress={invalidateRecentMeals}
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
                    <View
                      key={meal.id}
                      className="bg-white rounded-2xl px-3 py-2 shadow-sm"
                    >
                      <View className="flex-row items-center">
                        <Image
                          source={{ uri: meal.photo_url }}
                          className="w-20 h-20 rounded-xl mr-4"
                        />
                        <View className="flex-1">
                          <View className="flex-row justify-between items-start">
                            <Text
                              className="font-semibold text-gray-900 text-base w-[70%]"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {meal.name}
                            </Text>
                            <Text className="text-sm text-gray-500">
                              {formatTime(meal.created_at)}
                            </Text>
                          </View>
                          <Text className="text-gray-600 text-md mb-2">
                            {Math.round(meal.calories)} calories
                          </Text>
                          <View className="flex-row items-center">
                            <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                              <View className="bg-rose-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                                <Text className="text-xs font-medium text-rose-600">
                                  P
                                </Text>
                              </View>
                              <Text className="text-xs font-medium">
                                {Math.round(meal.protein)}g
                              </Text>
                            </View>
                            <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                              <View className="bg-orange-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                                <Text className="text-xs font-medium text-orange-600">
                                  F
                                </Text>
                              </View>
                              <Text className="text-xs font-medium">
                                {Math.round(meal.protein)}g
                              </Text>
                            </View>
                            <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                              <View className="bg-sky-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                                <Text className="text-xs font-medium text-sky-600">
                                  C
                                </Text>
                              </View>
                              <Text className="text-xs font-medium">
                                {Math.round(meal.carbs)}g
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
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

                {/* <View className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 mb-6 w-full">
                  <Text className="text-center text-gray-700 font-medium">
                    💡 <Text className="font-bold">Pro Tip:</Text> Users with
                    30+ day streaks are 5x more likely to reach their goals!
                  </Text>
                </View> */}

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

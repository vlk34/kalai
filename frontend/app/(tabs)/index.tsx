"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  FontAwesome5,
  MaterialIcons,
  FontAwesome,
  Feather,
} from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRecentMeals } from "@/hooks/useRecentMeals";
import { useMutateRecentMeals } from "@/hooks/useMutateRecentMeals";
import { useAnalyzeFood } from "@/hooks/useAnalyzeFood";
import { useMutateNutrition } from "@/hooks/useMutateNutrition";
import {
  useDailyNutritionSummary,
  getDateForDayOfWeek,
  formatDateForAPI,
} from "@/hooks/useUserProfile";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardScreen() {
  // Initialize with today's date
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateForAPI(new Date())
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    new Date().getDay()
  );
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  // Plus button and modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const buttonAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const bgOpacityAnim = useRef(new Animated.Value(0)).current;
  const { analyzeFood } = useAnalyzeFood();
  const { addOptimisticMeal, updateOptimisticMeal } = useMutateRecentMeals();
  const { addMealToNutrition } = useMutateNutrition();

  // Request permissions when component mounts
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to make this work!"
        );
      }
    })();
  }, []);

  // Simple animation for modal
  const showModal = () => {
    setShowActionModal(true);
    Animated.parallel([
      Animated.spring(modalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(bgOpacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
      Animated.timing(bgOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start(() => setShowActionModal(false));
  };

  const handleCameraPress = () => {
    hideModal();
    router.push("/camera");
  };

  const handleGalleryPress = async () => {
    hideModal();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        const photoUri = result.assets[0].uri;

        // Create optimistic meal entry
        const optimisticMeal = {
          id: `temp-${Date.now()}`,
          name: "Analyzing...",
          emoji: "🍽️",
          protein: 0,
          carbs: 0,
          fats: 0,
          calories: 0,
          created_at: new Date().toISOString(),
          photo_url: photoUri,
          isAnalyzing: true,
        };

        // Add to recent meals optimistically
        const today = formatDateForAPI(new Date());
        addOptimisticMeal(optimisticMeal, today);

        // Start analysis in background
        try {
          const result = await analyzeFood(photoUri);

          // Extract the real data from server response
          const serverData = result.data;
          const databaseRecord = serverData.database_record;
          const photoUrl = serverData.file_info?.photo_url;

          // Replace the optimistic meal with real server data
          updateOptimisticMeal(
            optimisticMeal.id,
            {
              id: databaseRecord.id, // Replace temp ID with real ID
              name: databaseRecord.name,
              emoji: databaseRecord.emoji,
              protein: databaseRecord.protein,
              carbs: databaseRecord.carbs,
              fats: databaseRecord.fats,
              calories: databaseRecord.calories,
              photo_url: photoUrl || optimisticMeal.photo_url, // Use server photo URL
              created_at: databaseRecord.created_at,
              isAnalyzing: false,
            },
            today
          );

          // Optimistically update nutrition with the real meal data
          addMealToNutrition(
            {
              calories: databaseRecord.calories,
              protein: databaseRecord.protein,
              carbs: databaseRecord.carbs,
              fats: databaseRecord.fats,
            },
            today
          );

          // Invalidate both recent meals and nutrition summary to ensure fresh data
          queryClient.invalidateQueries({
            queryKey: ["recent-meals", session?.user?.id, today],
          });
          queryClient.invalidateQueries({
            queryKey: ["daily-nutrition-summary", session?.user?.id, today],
          });
        } catch (error) {
          console.error("Analysis failed:", error);
          // Update with error state
          updateOptimisticMeal(
            optimisticMeal.id,
            {
              name: "Analysis Failed",
              emoji: "❌",
              protein: 0,
              carbs: 0,
              fats: 0,
              calories: 0,
              isAnalyzing: false,
            },
            today
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to pick an image from gallery. Please try again."
      );
    }
  };

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
    if (!session?.user?.id) {
      console.log("No session available, skipping day selection");
      return;
    }

    try {
      const dateForDay = getDateForDayOfWeek(dayIndex);
      setSelectedDate(dateForDay);
      setSelectedDayIndex(dayIndex);
    } catch (error) {
      console.error("Error selecting day:", error);
    }
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
      pathname: "/(tabs)/edit-meal" as any,
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
  useEffect(() => {
    // Only run if we have a session and the component is properly mounted
    if (session?.user?.id && selectedDate) {
      try {
        // Only invalidate nutrition data for the current selected date
        queryClient.invalidateQueries({
          queryKey: ["daily-nutrition-summary", session.user.id, selectedDate],
        });
      } catch (error) {
        console.error("Error invalidating queries:", error);
      }
    }
  }, [queryClient, selectedDate, session?.user?.id]);

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

          {/* Floating Plus Button */}
          <Animated.View
            style={{
              position: "absolute",
              bottom: insets.bottom + 30,
              left: "50%",
              marginLeft: -30,
              zIndex: 1000,
            }}
          >
            <TouchableOpacity
              onPress={showModal}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#000000",
                justifyContent: "center",
                alignItems: "center",
                elevation: 8,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                borderWidth: 4,
                borderColor: "white",
              }}
            >
              <Feather name="plus" size={28} color="white" />
            </TouchableOpacity>
          </Animated.View>

          {/* Action Modal */}
          <Modal
            visible={showActionModal}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={hideModal}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={hideModal}
              style={{ flex: 1 }}
            >
              {/* Separate background overlay */}
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.3)",
                  opacity: bgOpacityAnim,
                }}
              />

              {/* Modal content */}
              <View style={{ flex: 1, overflow: "hidden" }}>
                <Animated.View
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    transform: [
                      {
                        translateY: modalAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [400, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                  >
                    <View className="bg-white rounded-t-3xl p-6">
                      {/* Header */}
                      <View className="items-center mb-6">
                        <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
                        <Text className="text-2xl font-bold text-black mb-2">
                          Add Food
                        </Text>
                        <Text className="text-gray-600 text-center">
                          Choose how you'd like to log your meal
                        </Text>
                      </View>

                      {/* Action Buttons */}
                      <View className="space-y-0">
                        {/* Camera Button */}
                        <TouchableOpacity
                          onPress={handleCameraPress}
                          className="flex-row items-center py-4 px-2"
                        >
                          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
                            <FontAwesome
                              name="camera"
                              size={20}
                              color="#374151"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-lg font-semibold text-black">
                              Camera
                            </Text>
                            <Text className="text-sm text-gray-600">
                              Take a photo of your meal
                            </Text>
                          </View>
                          <Feather
                            name="chevron-right"
                            size={20}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>

                        {/* Divider */}
                        <View className="h-px bg-gray-200 mx-2" />

                        {/* Gallery Button */}
                        <TouchableOpacity
                          onPress={handleGalleryPress}
                          className="flex-row items-center py-4 px-2"
                        >
                          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
                            <MaterialIcons
                              name="photo-library"
                              size={20}
                              color="#374151"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-lg font-semibold text-black">
                              Gallery
                            </Text>
                            <Text className="text-sm text-gray-600">
                              Choose from your photos
                            </Text>
                          </View>
                          <Feather
                            name="chevron-right"
                            size={20}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Modal>

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

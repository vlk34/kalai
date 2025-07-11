import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFullHistory } from "@/hooks/useFullHistory";

export default function HistoryScreen() {
  const router = useRouter();
  const { data: historyData, isLoading, error } = useFullHistory();

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

  // Function to format date from ISO string to readable format
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch (error) {
      return "Unknown";
    }
  };

  interface FoodItem {
    id: string;
    name: string;
    emoji: string;
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
    created_at: string;
    photo_url: string;
    portion: number;
  }

  // Group meals by date
  const groupMealsByDate = (meals: FoodItem[]) => {
    const grouped = meals.reduce(
      (acc, meal) => {
        const date = new Date(meal.created_at).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(meal);
        return acc;
      },
      {} as Record<string, FoodItem[]>
    );

    return Object.entries(grouped).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#e5e7eb", "#f4f4f4"]}
        locations={[0, 0.7]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-3 p-2 -ml-2"
              >
                <MaterialIcons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-900">
                Food History
              </Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View className="bg-white rounded-2xl p-8 shadow-sm">
                <ActivityIndicator size="large" color="#000" />
                <Text className="text-gray-500 text-center mt-4">
                  Loading your food history...
                </Text>
              </View>
            ) : error ? (
              <View className="bg-white rounded-2xl p-6 shadow-sm">
                <Text className="text-red-500 text-center mb-2">
                  Failed to load food history
                </Text>
                <Text className="text-gray-500 text-center">
                  Please try again later
                </Text>
              </View>
            ) : !historyData?.foods || historyData.foods.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 shadow-sm">
                <Text className="text-gray-500 text-center mb-2">
                  No food history available
                </Text>
                <Text className="text-gray-400 text-center text-sm">
                  Start by taking a photo of your meal!
                </Text>
              </View>
            ) : (
              <View className="pb-20">
                {/* Total Summary */}
                <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
                  <Text className="text-lg font-semibold text-gray-900 mb-4">
                    Total Summary
                  </Text>
                  <View className="flex-row justify-between">
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-black">
                        {Math.round(historyData.daily_totals.calories)}
                      </Text>
                      <Text className="text-xs text-gray-500">Calories</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-rose-600">
                        {Math.round(historyData.daily_totals.protein)}g
                      </Text>
                      <Text className="text-xs text-gray-500">Protein</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-orange-600">
                        {Math.round(historyData.daily_totals.carbs)}g
                      </Text>
                      <Text className="text-xs text-gray-500">Carbs</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-sky-600">
                        {Math.round(historyData.daily_totals.fats)}g
                      </Text>
                      <Text className="text-xs text-gray-500">Fats</Text>
                    </View>
                  </View>
                </View>

                {/* Grouped Meals */}
                {groupMealsByDate(historyData.foods).map(([date, meals]) => (
                  <View key={date} className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-3 px-2">
                      {formatDate((meals as FoodItem[])[0].created_at)}
                    </Text>
                    <View className="space-y-3 gap-3">
                      {(meals as FoodItem[]).map((meal) => (
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
                                  className="font-semibold text-base w-[70%] text-gray-900"
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {meal.name}
                                </Text>
                                <Text className="text-sm text-gray-500">
                                  {formatTime(meal.created_at)}
                                </Text>
                              </View>
                              <Text className="text-md mb-2 text-gray-600">
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
                                      C
                                    </Text>
                                  </View>
                                  <Text className="text-xs font-medium">
                                    {Math.round(meal.carbs)}g
                                  </Text>
                                </View>
                                <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                                  <View className="bg-sky-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                                    <Text className="text-xs font-medium text-sky-600">
                                      F
                                    </Text>
                                  </View>
                                  <Text className="text-xs font-medium">
                                    {Math.round(meal.fats)}g
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

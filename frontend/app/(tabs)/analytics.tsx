"use client";
import { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWeeklyNutritionSummary } from "@/hooks/useWeeklyNutritionSummary";
import { router } from "expo-router";

export default function AnalyticsScreen() {
  const screenWidth = Dimensions.get("window").width;

  // Fetch real user profile data
  const { data: userProfileResponse, isLoading: isLoadingProfile } =
    useUserProfile();
  const profile = userProfileResponse?.profile;

  // Fetch real weekly nutrition data
  const { data: weeklyData, isLoading: isLoadingNutrition } =
    useWeeklyNutritionSummary();

  // Get weight in kg for BMI calculation
  const getWeightInKg = (): number => {
    if (!profile) return 0;
    if (profile.weight_unit === "imperial") {
      return profile.weight_value * 0.453592; // lbs to kg
    }
    return profile.weight_value;
  };

  // Get height in cm for BMI calculation
  const getHeightInCm = (): number => {
    if (!profile) return 0;
    if (profile.height_unit === "imperial") {
      const totalInches =
        profile.height_value * 12 + (profile.height_inches || 0);
      return totalInches * 2.54; // inches to cm
    }
    return profile.height_value;
  };

  const weightInKg = getWeightInKg();
  const heightInCm = getHeightInCm();

  // Calculate BMI
  const bmi =
    heightInCm > 0 ? weightInKg / Math.pow(heightInCm / 100, 2) : 0;
  const getBMIStatus = (bmi: number) => {
    if (bmi <= 0) return { status: "unknown", color: "text-gray-500" };
    if (bmi < 18.5) return { status: "underweight", color: "text-blue-500" };
    if (bmi < 25) return { status: "healthy", color: "text-green-500" };
    if (bmi < 30) return { status: "overweight", color: "text-orange-500" };
    return { status: "obese", color: "text-red-500" };
  };

  const bmiStatus = getBMIStatus(bmi);

  // Get the weight unit label
  const weightUnit = profile?.weight_unit === "imperial" ? "lbs" : "kg";

  // Build nutrition chart data from weekly API data
  const nutritionChartData = useMemo(() => {
    if (!weeklyData?.weekly_nutrition) {
      return {
        labels: ["--", "--", "--", "--", "--"],
        datasets: [
          {
            data: [0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      };
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // Sort dates from oldest to newest
    const sortedDates = Object.keys(weeklyData.weekly_nutrition).sort();

    const labels = sortedDates.map((dateStr) => {
      const date = new Date(dateStr + "T00:00:00");
      return dayNames[date.getDay()];
    });

    const caloriesData = sortedDates.map(
      (dateStr) => weeklyData.weekly_nutrition[dateStr].consumed_today.calories
    );

    return {
      labels: labels.length > 0 ? labels : ["--"],
      datasets: [
        {
          data: caloriesData.length > 0 ? caloriesData : [0],
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  }, [weeklyData]);

  const avgCalories = useMemo(() => {
    const data = nutritionChartData.datasets[0].data;
    if (data.length === 0 || data.every((d) => d === 0)) return 0;
    const nonZero = data.filter((d) => d > 0);
    if (nonZero.length === 0) return 0;
    return nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
  }, [nutritionChartData]);

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
    },
  };

  const handleUpdateGoal = () => {
    router.push("/(tabs)/edit-profile");
  };

  const handleLogWeight = () => {
    router.push("/(tabs)/edit-profile");
  };

  if (isLoadingProfile) {
    return (
      <LinearGradient
        colors={["#fafafa", "#f4f6f8", "#eef2f5"]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-gray-500 mt-4">Loading analytics...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#fafafa", "#f4f6f8", "#eef2f5"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="py-6">
            <Text className="text-2xl font-bold text-gray-900">Analytics</Text>
          </View>

          {/* Current Weight Section */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Current Weight
            </Text>
            <Text className="text-3xl font-bold text-gray-900 mb-4">
              {profile?.weight_value ?? "--"} {weightUnit}
            </Text>

            <View className="bg-blue-50 rounded-2xl p-4 mb-4">
              <Text className="text-blue-800 text-sm leading-5">
                Update your weight frequently for more accurate tracking and
                better insights into your progress.
              </Text>
            </View>

            <TouchableOpacity
              className="bg-green-500 rounded-2xl py-3 items-center"
              onPress={handleLogWeight}
            >
              <Text className="text-white font-semibold">Update Weight</Text>
            </TouchableOpacity>
          </View>

          {/* BMI Section */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Your BMI
            </Text>
            {bmi > 0 ? (
              <>
                <Text className="text-gray-700 mb-4">
                  Your weight is{" "}
                  <Text className={`font-semibold ${bmiStatus.color}`}>
                    {bmiStatus.status}
                  </Text>
                </Text>

                <Text className="text-2xl font-bold text-gray-900 mb-4">
                  {bmi.toFixed(1)}
                </Text>
              </>
            ) : (
              <Text className="text-gray-500 mb-4">
                Complete your profile to see BMI
              </Text>
            )}

            {/* BMI Scale */}
            <View className="mb-4">
              <View className="flex-row h-3 rounded-full overflow-hidden mb-3">
                <View className="flex-1 bg-blue-400" />
                <View className="flex-1 bg-green-500" />
                <View className="flex-1 bg-orange-500" />
                <View className="flex-1 bg-red-500" />
              </View>

              <View className="flex-row justify-between">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-blue-400 rounded-full mr-1" />
                  <Text className="text-gray-600 text-xs">Underweight</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  <Text className="text-gray-600 text-xs">Healthy</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-orange-500 rounded-full mr-1" />
                  <Text className="text-gray-600 text-xs">Overweight</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-red-500 rounded-full mr-1" />
                  <Text className="text-gray-600 text-xs">Obese</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Daily Targets Section */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Daily Targets
              </Text>
              <TouchableOpacity
                className="bg-black rounded-full px-4 py-2"
                onPress={handleUpdateGoal}
              >
                <Text className="text-white text-sm font-medium">Update</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-500">
                  {profile?.daily_calories ?? "--"}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">Calories</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-blue-500">
                  {profile?.daily_protein_g ?? "--"}g
                </Text>
                <Text className="text-gray-500 text-xs mt-1">Protein</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-orange-500">
                  {profile?.daily_carbs_g ?? "--"}g
                </Text>
                <Text className="text-gray-500 text-xs mt-1">Carbs</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-purple-500">
                  {profile?.daily_fats_g ?? "--"}g
                </Text>
                <Text className="text-gray-500 text-xs mt-1">Fats</Text>
              </View>
            </View>
          </View>

          {/* Nutrition Section */}
          <View className="bg-white rounded-3xl p-6 mb-20 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Nutrition (Last 5 Days)
              </Text>
            </View>

            {isLoadingNutrition ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="text-gray-500 mt-2 text-sm">
                  Loading nutrition data...
                </Text>
              </View>
            ) : (
              <>
                {/* Calories Header */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-base font-semibold text-gray-900">
                    Total Calories
                  </Text>
                  <Text className="text-gray-600">
                    Daily Avg:{" "}
                    {avgCalories > 0 ? avgCalories.toFixed(0) : "--"} cal
                  </Text>
                </View>

                {/* Nutrition Chart */}
                <LineChart
                  data={nutritionChartData}
                  width={screenWidth - 80}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) =>
                      `rgba(59, 130, 246, ${opacity})`,
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />

                {weeklyData?.daily_goals && (
                  <View className="mt-2 bg-blue-50 rounded-2xl p-3">
                    <Text className="text-blue-800 text-xs text-center">
                      Daily Goal: {weeklyData.daily_goals.calories} cal
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

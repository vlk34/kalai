"use client";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";

export default function AnalyticsScreen() {
  const [weightFilter, setWeightFilter] = useState("90 days");
  const [nutritionFilter, setNutritionFilter] = useState("this week");

  const screenWidth = Dimensions.get("window").width;

  // Sample user data
  const userData = {
    weightGoal: 70,
    currentWeight: 75.5,
    height: 175, // cm
    goalAchieved: 15.2,
  };

  // Calculate BMI
  const bmi = userData.currentWeight / Math.pow(userData.height / 100, 2);
  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: "underweight", color: "text-blue-500" };
    if (bmi < 25) return { status: "healthy", color: "text-green-500" };
    if (bmi < 30) return { status: "overweight", color: "text-orange-500" };
    return { status: "obese", color: "text-red-500" };
  };

  const bmiStatus = getBMIStatus(bmi);

  // Sample weight progress data
  const weightData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [78, 77.2, 76.8, 76.1, 75.8, 75.5],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  // Sample nutrition data
  const nutritionData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [2100, 1950, 2200, 2050, 2150, 2300, 1900],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 1,
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

  const avgCalories =
    nutritionData.datasets[0].data.reduce((a, b) => a + b, 0) /
    nutritionData.datasets[0].data.length;

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

          {/* Weight Goal Section */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Weight Goal
              </Text>
              <TouchableOpacity className="bg-black rounded-full px-4 py-2">
                <Text className="text-white text-sm font-medium">Update</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-3xl font-bold text-green-500">
              {userData.weightGoal} kg
            </Text>
          </View>

          {/* Current Weight Section */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Current Weight
            </Text>
            <Text className="text-3xl font-bold text-gray-900 mb-4">
              {userData.currentWeight} kg
            </Text>

            <View className="bg-blue-50 rounded-2xl p-4 mb-4">
              <Text className="text-blue-800 text-sm leading-5">
                💡 Update your weight frequently for more accurate tracking and
                better insights into your progress.
              </Text>
            </View>

            <TouchableOpacity className="bg-green-500 rounded-2xl py-3 items-center">
              <Text className="text-white font-semibold">Log Weight</Text>
            </TouchableOpacity>
          </View>

          {/* BMI Section */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Your BMI
            </Text>
            <Text className="text-gray-700 mb-4">
              Your weight is{" "}
              <Text className={`font-semibold ${bmiStatus.color}`}>
                {bmiStatus.status}
              </Text>
            </Text>

            <Text className="text-2xl font-bold text-gray-900 mb-4">
              {bmi.toFixed(1)}
            </Text>

            {/* BMI Scale */}
            <View className="mb-4">
              <View className="flex-row h-3 rounded-full overflow-hidden mb-3">
                <View className="flex-1 bg-blue-400" />
                <View className="flex-1 bg-green-500" />
                <View className="flex-1 bg-orange-500" />
                <View className="flex-1 bg-red-500" />
              </View>

              <View className="flex-row justify-between text-xs">
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

          {/* Progress Section */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Progress
              </Text>
              <Text className="text-green-500 font-semibold">
                {userData.goalAchieved}% goal achieved
              </Text>
            </View>

            {/* Weight Filter Buttons */}
            <View className="flex-row gap-1 mb-4 space-x-2">
              {["90 days", "6 months", "1 year", "All Time"].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setWeightFilter(filter)}
                  className={`px-3 py-2 rounded-full ${weightFilter === filter ? "bg-green-500" : "bg-gray-100"}`}
                >
                  <Text
                    className={`text-xs font-medium ${weightFilter === filter ? "text-white" : "text-gray-600"}`}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Weight Chart */}
            <LineChart
              data={weightData}
              width={screenWidth - 80}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>

          {/* Nutrition Section */}
          <View className="bg-white rounded-3xl p-6 mb-20 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Nutrition
              </Text>
            </View>

            {/* Nutrition Filter Buttons */}
            <View className="flex-row gap-1 mb-4 space-x-2">
              {["this week", "last week", "2 wks ago", "3 wks ago"].map(
                (filter) => (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => setNutritionFilter(filter)}
                    className={`px-3 py-2 rounded-full ${nutritionFilter === filter ? "bg-blue-500" : "bg-gray-100"}`}
                  >
                    <Text
                      className={`text-xs font-medium ${nutritionFilter === filter ? "text-white" : "text-gray-600"}`}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* Calories Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-semibold text-gray-900">
                Total Calories
              </Text>
              <Text className="text-gray-600">
                Daily Avg: {avgCalories.toFixed(0)} cal
              </Text>
            </View>

            {/* Nutrition Chart */}
            <LineChart
              data={nutritionData}
              width={screenWidth - 80}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

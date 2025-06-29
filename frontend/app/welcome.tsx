"use client";

import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  return (
    <LinearGradient
      colors={["#10b981", "#059669", "#047857"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center px-8">
          {/* Logo/Icon */}
          <View className="bg-white bg-opacity-20 rounded-full p-8 mb-8">
            <Text className="text-6xl">🍎</Text>
          </View>

          {/* Main Title */}
          <Text className="text-4xl font-bold text-white text-center mb-4">
            Welcome to Kal AI
          </Text>

          {/* Subtitle */}
          <Text className="text-xl text-white text-center mb-8 opacity-90">
            Calorie tracking made effortless
          </Text>

          {/* Features */}
          <View className="space-y-6 mb-12">
            <View className="flex-row items-center">
              <View className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                <Text className="text-2xl">📸</Text>
              </View>
              <Text className="text-white text-lg flex-1">
                Snap a quick photo of your meal and we'll handle the rest
              </Text>
            </View>

            <View className="flex-row items-center">
              <View className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                <Text className="text-2xl">🤖</Text>
              </View>
              <Text className="text-white text-lg flex-1">
                AI-powered nutrition analysis in seconds
              </Text>
            </View>

            <View className="flex-row items-center">
              <View className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                <Text className="text-2xl">📊</Text>
              </View>
              <Text className="text-white text-lg flex-1">
                Track your progress with detailed insights
              </Text>
            </View>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            onPress={handleGetStarted}
            className="bg-white rounded-2xl py-4 px-12 shadow-lg"
          >
            <Text className="text-green-600 font-bold text-lg">
              Get Started
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

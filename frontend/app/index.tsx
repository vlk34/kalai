"use client";

import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

export default function InitialScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = await AsyncStorage.getItem(
        "hasCompletedOnboarding"
      );

      // Add a small delay for smooth transition
      setTimeout(() => {
        if (hasCompletedOnboarding === "true") {
          // User has completed onboarding, go to main app
          router.replace("/(tabs)");
        } else {
          // First time user, show welcome screen
          router.replace("/welcome");
        }
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // Default to showing welcome screen on error
      router.replace("/welcome");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#10b981", "#059669", "#047857"]}
        className="flex-1"
      >
        <View className="flex-1 justify-center items-center">
          {/* Loading Screen */}
          <View className="bg-white bg-opacity-20 rounded-full p-8 mb-8">
            <Text className="text-6xl">🍎</Text>
          </View>
          <Text className="text-3xl font-bold text-white mb-4">Kal AI</Text>
          <Text className="text-white opacity-80">
            Loading your nutrition journey...
          </Text>

          {/* Loading indicator */}
          <View className="flex-row mt-6 space-x-2">
            <View className="w-2 h-2 bg-white rounded-full opacity-60 animate-pulse" />
            <View
              className="w-2 h-2 bg-white rounded-full opacity-80 animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <View
              className="w-2 h-2 bg-white rounded-full opacity-100 animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </View>
        </View>
      </LinearGradient>
    );
  }

  return null;
}

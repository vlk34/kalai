"use client";

import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
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
        colors={["#fafafa", "#f4f6f8", "#eef2f5"]}
        className="flex-1"
      >
        <View className="flex-1 justify-center items-center">
          {/* Loading Screen */}
          <View className="bg-white bg-opacity-50 rounded-full px-6 py-5 mb-4">
            <FontAwesome5 name="apple-alt" size={32} color="black" />
          </View>
          <Text className="text-3xl font-bold text-black mb-2">Kal AI</Text>
          <Text className="text-black opacity-80">
            Loading your nutrition journey...
          </Text>

          {/* Loading indicator */}
          <View className="flex-row mt-6 space-x-2">
            <View className="w-2 h-2 bg-black rounded-full opacity-60 animate-pulse" />
            <View
              className="w-2 h-2 bg-black rounded-full opacity-80 animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <View
              className="w-2 h-2 bg-black rounded-full opacity-100 animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </View>
        </View>
      </LinearGradient>
    );
  }

  return null;
}

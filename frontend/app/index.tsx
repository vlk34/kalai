"use client";

import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { View, ActivityIndicator } from "react-native";

// This screen should not be reached in normal flow
// All navigation logic is handled in _layout.tsx
export default function IndexScreen() {
  const { session, isLoading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    if (session && hasCompletedOnboarding === null) {
      checkOnboardingStatus();
    }
  }, [session, hasCompletedOnboarding]);

  useEffect(() => {
    console.log("hasCompletedOnboarding:", hasCompletedOnboarding);
  }, [hasCompletedOnboarding]);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem("hasCompletedOnboarding");
      console.log("Checking onboarding status:", completed);
      setHasCompletedOnboarding(completed === "true");
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setHasCompletedOnboarding(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/signin" />;
  }

  if (hasCompletedOnboarding === null) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    console.log("Redirecting to welcome");
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}

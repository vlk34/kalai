"use client";

import { useEffect } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { View, ActivityIndicator } from "react-native";

// This screen should not be reached in normal flow
// All navigation logic is handled in _layout.tsx
export default function IndexScreen() {
  const { session, isLoading, hasCompletedOnboarding } = useAuth();

  if (hasCompletedOnboarding === null || isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/welcome" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

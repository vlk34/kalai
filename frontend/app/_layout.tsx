"use client";

import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import "../global.css";

function LoadingScreen() {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
}

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    if (session && hasCompletedOnboarding === null) {
      checkOnboardingStatus();
    }
  }, [session, hasCompletedOnboarding]);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem("hasCompletedOnboarding");
      setHasCompletedOnboarding(completed === "true");
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setHasCompletedOnboarding(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/(auth)/signin" />;
  }

  if (hasCompletedOnboarding === null) {
    return <LoadingScreen />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <ThemeProvider value={DarkTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="camera" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
            <RootLayoutNav />
          </ThemeProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

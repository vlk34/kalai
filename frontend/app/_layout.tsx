"use client";

import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { SelectorProvider } from "@/contexts/SelectorContext";
import "../global.css";

function LoadingScreen() {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
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
          <SelectorProvider>
            <ThemeProvider value={DefaultTheme}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="(auth)"
                  options={{
                    gestureEnabled: true,
                  }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="welcome"
                  options={{
                    gestureEnabled: true,
                  }}
                />
                <Stack.Screen
                  name="auth-selection"
                  options={{
                    gestureEnabled: true,
                  }}
                />
                <Stack.Screen
                  name="onboarding"
                  options={{
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </SelectorProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

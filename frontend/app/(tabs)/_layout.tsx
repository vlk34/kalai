"use client";

import { Stack } from "expo-router";
import { View } from "react-native";

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="edit-meal" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="height-selector" />
        <Stack.Screen name="weight-selector" />
        <Stack.Screen name="date-selector" />
      </Stack>
    </View>
  );
}

import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { usePathname } from "expo-router";
import { StreakProvider } from "@/contexts/StreakContext";

export default function TabLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Hide tabs when camera is open
  const shouldHideTabs = pathname === "/camera";
  return (
    <StreakProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#10b981", // Green color matching the design
          tabBarInactiveTintColor: "#9ca3af", // Gray color matching the design
          headerShown: false,
          tabBarStyle: shouldHideTabs
            ? { display: "none" }
            : {
                backgroundColor: "white",
                borderTopWidth: 0,
                paddingBottom: insets.bottom + 8, // Add safe area bottom padding
                paddingTop: 8,
                height: 70 + insets.bottom, // Add safe area bottom height
                position: "absolute",
              },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Feather name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: "Analytics",
            tabBarIcon: ({ color }) => (
              <Feather name="bar-chart-2" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Feather name="settings" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            href: null,
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Feather name="settings" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </StreakProvider>
  );
}

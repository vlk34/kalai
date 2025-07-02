import { Tabs } from "expo-router";
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { usePathname, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

export default function TabLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Hide tabs when camera is open
  const shouldHideTabs = pathname === "/camera";

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#10b981",
          tabBarInactiveTintColor: "#9ca3af",
          headerShown: false,
          tabBarStyle: shouldHideTabs
            ? { display: "none" }
            : {
                backgroundColor: "white",
                borderTopWidth: 0,
                paddingBottom: insets.bottom + 8,
                paddingTop: 8,
                height: 70 + insets.bottom,
                position: "absolute",
                elevation: 0,
                shadowOpacity: 0,
                paddingLeft: 10, // Squeeze buttons slightly to the left
                paddingRight: 40, // Make room for the floating camera button
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
            title: "Camera",
            tabBarIcon: ({ color }) => (
              <Feather name="camera" size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Floating Camera Button */}
      {!shouldHideTabs && (
        <TouchableOpacity
          onPress={() => router.push("/camera")}
          style={{
            position: "absolute",
            bottom: insets.bottom + 60, // Half of the button will be above the tab bar
            right: "10%", // Position at 80% from the left (20% from the right)
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "#000000", // Changed to black
            justifyContent: "center",
            alignItems: "center",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
            borderWidth: 4,
            borderColor: "white",
          }}
        >
          <FontAwesome name="camera" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

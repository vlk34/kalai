"use client";
import { View, Text, TouchableOpacity, Animated, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import React, { useState } from "react";

export default function WelcomeScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleGetStarted = () => {
    router.push("/auth-selection");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Background with single image - 70% of screen */}
        <View style={{ height: "80%", position: "relative" }}>
          {/* Full background image */}
          <Image
            source={require("../assets/images/welcome.jpg")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            onLoad={() => console.log("Image loaded successfully")}
            onError={(error) => console.log("Image loading error:", error)}
          />
        </View>

        {/* Bottom Modal - positioned at the bottom */}
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
          }}
          className="absolute bottom-0 left-0 right-0 h-[30%] bg-white rounded-t-3xl px-8 pt-8 shadow-2xl"
        >
          <View className="flex-1">
            {/* Title */}
            <Text className="text-3xl font-bold text-black text-center mb-3">
              Welcome to Kal AI!
            </Text>

            {/* Subtitle */}
            <Text className="text-base text-gray-500 text-center mb-8 leading-5 px-4">
              Smart calorie tracking with AI-powered nutrition analysis
            </Text>

            {/* Get Started Button */}
            <TouchableOpacity
              onPress={handleGetStarted}
              className="bg-black rounded-2xl py-4 px-8 shadow-sm"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-lg text-center">
                Get started
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

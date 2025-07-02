"use client";

import { View, Text, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";

export default function WelcomeScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="flex-1 justify-center items-center px-8"
        >
          {/* Logo/Icon */}
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
            }}
            className="bg-gray-100 rounded-2xl p-6 mb-8 shadow-sm"
          >
            <FontAwesome5 name="apple-alt" size={48} color="#000" />
          </Animated.View>

          {/* Main Title */}
          <Text className="text-4xl font-bold text-black text-center mb-3 tracking-tight">
            Kal AI
          </Text>

          {/* Subtitle */}
          <Text className="text-lg text-gray-600 text-center mb-12 font-light">
            Smart calorie tracking with AI
          </Text>

          {/* Features */}
          <View className="space-y-6 gap-4 mb-12 items-center">
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              }}
              className="flex-row items-center"
            >
              <View className="bg-black rounded-full p-3 mr-4">
                <FontAwesome5 name="camera" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-black text-base font-semibold">
                  Photo Recognition
                </Text>
                <Text className="text-gray-600 text-sm">
                  Instant nutrition analysis
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              }}
              className="flex-row items-center"
            >
              <View className="bg-black rounded-full p-3 mr-4">
                <FontAwesome5 name="brain" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-black text-base font-semibold">
                  AI-Powered
                </Text>
                <Text className="text-gray-600 text-sm">
                  Accurate calorie counting
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              }}
              className="flex-row items-center"
            >
              <View className="bg-black rounded-full p-3 mr-4">
                <FontAwesome5 name="chart-line" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-black text-base font-semibold">
                  Smart Tracking
                </Text>
                <Text className="text-gray-600 text-sm">
                  Personalized insights
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            onPress={handleGetStarted}
            className="bg-black rounded-2xl py-4 px-12 shadow-lg"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base text-center">
              Get Started
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

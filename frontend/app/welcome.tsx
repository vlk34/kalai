"use client";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Target, TrendingUp, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import React, { useState } from "react";

export default function WelcomeScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

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
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1">
        {/* Top 30% space for image */}
        <View className="h-[30%] bg-black" />

        {/* Bottom container with content */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="flex-1 bg-white rounded-t-3xl px-8 pt-8"
        >
          {/* Main Title */}
          <Text className="text-4xl font-bold text-black text-center mb-3 tracking-tight">
            Kal AI
          </Text>

          {/* Subtitle */}
          <Text className="text-lg text-gray-600 text-center mb-12 font-light leading-6">
            Smart calorie tracking with AI
          </Text>

          {/* Features */}
          <View className="mb-12 gap-6">
            <View className="flex-row items-center">
              <View className="bg-gray-100 rounded-2xl p-4 mr-5">
                <Camera size={24} color="black" />
              </View>
              <View className="flex-1">
                <Text className="text-black text-lg font-semibold mb-1">
                  Photo Recognition
                </Text>
                <Text className="text-gray-600 text-base leading-5">
                  Instant nutrition analysis
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="bg-gray-100 rounded-2xl p-4 mr-5">
                <Target size={24} color="black" />
              </View>
              <View className="flex-1">
                <Text className="text-black text-lg font-semibold mb-1">
                  Reach Your Goals
                </Text>
                <Text className="text-gray-600 text-base leading-5">
                  Personalized daily targets
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="bg-gray-100 rounded-2xl p-4 mr-5">
                <TrendingUp size={24} color="black" />
              </View>
              <View className="flex-1">
                <Text className="text-black text-lg font-semibold mb-1">
                  Track Progress
                </Text>
                <Text className="text-gray-600 text-base leading-5">
                  Monitor your journey
                </Text>
              </View>
            </View>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            onPress={handleGetStarted}
            className="bg-black rounded-2xl py-5 px-12 shadow-lg flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg mr-2">
              Get Started
            </Text>
            <Sparkles size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

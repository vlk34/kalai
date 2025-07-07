"use client";
import { View, Text, TouchableOpacity, Animated, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import React, { useState } from "react";

export default function AuthSelectionScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [isNavigatingToSignup, setIsNavigatingToSignup] = useState(false);
  const [isNavigatingToSignin, setIsNavigatingToSignin] = useState(false);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleEmailSignup = () => {
    if (isNavigatingToSignup) return;
    setIsNavigatingToSignup(true);
    router.push("/(auth)/signup");
    setTimeout(() => setIsNavigatingToSignup(false), 1000);
  };

  const handleGoogleSignup = () => {
    // Handle Google signup
    console.log("Google signup");
  };

  const handleSignIn = () => {
    if (isNavigatingToSignin) return;
    setIsNavigatingToSignin(true);
    router.push("/(auth)/signin");
    setTimeout(() => setIsNavigatingToSignin(false), 1000);
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
          {/* Dark overlay */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1,
            }}
          />
        </View>

        {/* Bottom Modal - 50% of screen */}
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            zIndex: 10,
          }}
          className="absolute bottom-0 left-0 right-0 h-[50%] bg-white rounded-t-3xl px-8 pt-8 shadow-2xl"
        >
          <View className="flex-1">
            {/* Back button */}
            <TouchableOpacity
              className="absolute top-4 left-4 w-8 h-8 justify-center items-center"
              onPress={() => router.back()}
            >
              <Text className="text-gray-400 text-xl">←</Text>
            </TouchableOpacity>

            {/* Title */}
            <Text className="text-2xl font-bold text-black text-center mb-3 mt-4">
              Login or sign up
            </Text>
            {/* Subtitle */}
            <Text className="text-sm text-gray-500 text-center mb-8 leading-5 px-4">
              Please select your preferred method to continue setting up your
              account
            </Text>
            {/* Continue with Email Button */}
            <TouchableOpacity
              onPress={handleEmailSignup}
              className={`bg-black rounded-2xl py-4 mb-4 ${isNavigatingToSignup ? "opacity-50" : ""}`}
              activeOpacity={0.8}
              disabled={isNavigatingToSignup}
            >
              <Text className="text-white font-semibold text-base text-center">
                Sign up with Email
              </Text>
            </TouchableOpacity>
            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleSignup}
              className="bg-white border border-gray-200 rounded-2xl py-4 mb-6 flex-row justify-center items-center"
              activeOpacity={0.8}
            >
              <Text className="text-lg mr-2">G</Text>
              <Text className="text-gray-900 font-medium text-base">
                Sign in with Google
              </Text>
            </TouchableOpacity>
            {/* Already have account */}
            <TouchableOpacity
              onPress={handleSignIn}
              className={`mb-4 ${isNavigatingToSignin ? "opacity-50" : ""}`}
              activeOpacity={0.7}
              disabled={isNavigatingToSignin}
            >
              <Text className="text-center text-gray-600 text-sm">
                Already have an account?{" "}
                <Text className="text-black font-semibold">Sign in</Text>
              </Text>
            </TouchableOpacity>
            {/* Terms and Privacy */}
            <Text className="text-xs text-gray-400 mb-4 text-center leading-4 px-4">
              If you are creating a new account,{" "}
              <Text className="underline">Terms & Conditions</Text> and{" "}
              <Text className="underline">Privacy Policy</Text> will apply.
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

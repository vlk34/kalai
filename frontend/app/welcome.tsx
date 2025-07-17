"use client";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  Alert,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const navigation = useNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Intercept Android/iOS back button to show exit confirmation ONLY if root
  React.useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack && navigation.canGoBack()) {
        // Allow normal back navigation
        return false;
      }
      Alert.alert(t("welcome.exitConfirm"), t("welcome.exitMessage"), [
        {
          text: t("welcome.cancel"),
          style: "cancel",
          onPress: () => null,
        },
        {
          text: t("welcome.exit"),
          style: "destructive",
          onPress: () => BackHandler.exitApp(),
        },
      ]);
      return true; // Prevent default back behavior
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [navigation]);

  const handleGetStarted = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push("/auth-selection");
    setTimeout(() => setIsNavigating(false), 1000); // Fallback in case navigation fails
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
              {t("welcome.title")}
            </Text>

            {/* Subtitle */}
            <Text className="text-base text-gray-500 text-center mb-8 leading-5 px-4">
              {t("welcome.subtitle")}
            </Text>

            {/* Get Started Button */}
            <TouchableOpacity
              onPress={handleGetStarted}
              className={`bg-black rounded-2xl py-4 px-8 shadow-sm ${isNavigating ? "opacity-50" : ""}`}
              activeOpacity={0.8}
              disabled={isNavigating}
            >
              <Text className="text-white font-semibold text-lg text-center">
                {t("welcome.getStarted")}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

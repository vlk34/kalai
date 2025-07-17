"use client";
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/scripts/supabase";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

export default function SignIn() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(30));
  const [isNavigatingToSignup, setIsNavigatingToSignup] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  async function signInWithEmail() {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({}); // Clear any previous general errors

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrors({ general: error.message });
    } else {
      // Add a small delay to ensure navigation context is properly reset
      setTimeout(() => {
        try {
          router.replace("/");
        } catch (error) {
          console.error("Navigation error on sign in:", error);
        }
      }, 100);
    }
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center">
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
            }}
            className="px-6 py-8"
          >
            {/* Header */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                {t("auth.welcomeBack")}
              </Text>
              <Text className="text-gray-500 text-base">
                {t("auth.signInSubtitle")}
              </Text>
            </View>

            {/* General Error */}
            {errors.general && (
              <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Text className="text-red-600 text-sm">{errors.general}</Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-5">
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2 text-sm">
                  {t("auth.email")}
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-4 text-gray-900 ${
                    errors.email
                      ? "bg-red-50 border-red-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                  placeholder={t("auth.enterYourEmail")}
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearFieldError("email");
                  }}
                  onBlur={() => {
                    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
                      setErrors((prev) => ({
                        ...prev,
                        email: t("auth.validEmailError"),
                      }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                {errors.email && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.email}
                  </Text>
                )}
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2 text-sm">
                  {t("auth.password")}
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-4 text-gray-900 ${
                    errors.password
                      ? "bg-red-50 border-red-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                  placeholder={t("auth.enterYourPassword")}
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearFieldError("password");
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />
                {errors.password && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.password}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                className={`bg-black rounded-xl py-4 shadow-sm ${loading ? "opacity-70" : ""}`}
                onPress={signInWithEmail}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-center font-semibold text-base">
                    {t("auth.signIn")}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Sign Up Link */}
              <TouchableOpacity
                className="mt-6"
                onPress={() => {
                  if (isNavigatingToSignup) return;
                  setIsNavigatingToSignup(true);
                  router.replace("/(auth)/signup");
                  setTimeout(() => setIsNavigatingToSignup(false), 1000);
                }}
                activeOpacity={0.7}
                disabled={isNavigatingToSignup}
              >
                <Text className="text-center text-gray-500 text-sm">
                  {t("auth.dontHaveAccount")}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

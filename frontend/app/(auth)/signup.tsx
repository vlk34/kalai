"use client";
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ScrollView,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/scripts/supabase";
import { router } from "expo-router";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(30));
  const [isNavigatingToSignin, setIsNavigatingToSignin] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});

  React.useEffect(() => {
    // Delay the animation slightly to avoid transition conflicts
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  async function signUpWithEmail() {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({}); // Clear any previous general errors

    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      setErrors({ general: error.message });
    } else if (!session) {
      setErrors({
        general: "Success! Please check your inbox for email verification.",
      });
    } else {
      // Add a small delay to ensure navigation context is properly reset
      setTimeout(() => {
        try {
          router.replace("/");
        } catch (error) {
          console.error("Navigation error on sign up:", error);
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
                Create Account
              </Text>
              <Text className="text-gray-500 text-base">
                Sign up to get started with Kal AI
              </Text>
            </View>

            {/* General Message */}
            {errors.general && (
              <View
                className={`mb-4 p-3 border rounded-lg ${
                  errors.general.includes("Success")
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <Text
                  className={`text-sm ${
                    errors.general.includes("Success")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {errors.general}
                </Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-5">
              {/* Name Fields */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium mb-2 text-sm">
                    First Name
                  </Text>
                  <TextInput
                    className={`border rounded-xl px-4 py-4 text-gray-900 ${
                      errors.firstName
                        ? "bg-red-50 border-red-300"
                        : "bg-gray-50 border-gray-200"
                    }`}
                    placeholder="First name"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      clearFieldError("firstName");
                    }}
                    autoCapitalize="words"
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <Text className="text-red-500 text-xs mt-1">
                      {errors.firstName}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium mb-2 text-sm">
                    Last Name
                  </Text>
                  <TextInput
                    className={`border rounded-xl px-4 py-4 text-gray-900 ${
                      errors.lastName
                        ? "bg-red-50 border-red-300"
                        : "bg-gray-50 border-gray-200"
                    }`}
                    placeholder="Last name"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      clearFieldError("lastName");
                    }}
                    autoCapitalize="words"
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <Text className="text-red-500 text-xs mt-1">
                      {errors.lastName}
                    </Text>
                  )}
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2 text-sm">
                  Email
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-4 text-gray-900 ${
                    errors.email
                      ? "bg-red-50 border-red-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                  placeholder="Enter your email"
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
                        email: "Please enter a valid email address",
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
                  Password
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-4 text-gray-900 ${
                    errors.password
                      ? "bg-red-50 border-red-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearFieldError("password");
                  }}
                  onBlur={() => {
                    if (password.trim() && password.length < 6) {
                      setErrors((prev) => ({
                        ...prev,
                        password: "Password must be at least 6 characters",
                      }));
                    }
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />
                {errors.password ? (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.password}
                  </Text>
                ) : (
                  <Text className="text-gray-400 text-xs mt-2">
                    Must be at least 6 characters
                  </Text>
                )}
              </View>

              <TouchableOpacity
                className={`bg-black rounded-xl py-4 shadow-sm ${loading ? "opacity-70" : ""}`}
                onPress={signUpWithEmail}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-center font-semibold text-base">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* Sign In Link */}
              <TouchableOpacity
                className="mt-6"
                onPress={() => {
                  if (isNavigatingToSignin) return;
                  setIsNavigatingToSignin(true);
                  router.replace("/(auth)/signin");
                  setTimeout(() => setIsNavigatingToSignin(false), 1000);
                }}
                activeOpacity={0.7}
                disabled={isNavigatingToSignin}
              >
                <Text className="text-center text-gray-500 text-sm">
                  Already have an account?{" "}
                  <Text className="text-black font-semibold">Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

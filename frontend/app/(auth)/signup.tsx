"use client";
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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

  React.useEffect(() => {
    // Delay the animation slightly to avoid transition conflicts
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  async function signUpWithEmail() {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
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
      Alert.alert("Error", error.message);
    } else if (!session) {
      Alert.alert("Success", "Please check your inbox for email verification!");
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

            {/* Form */}
            <View className="space-y-5">
              {/* Name Fields */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium mb-2 text-sm">
                    First Name
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                    placeholder="First name"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoComplete="given-name"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium mb-2 text-sm">
                    Last Name
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                    placeholder="Last name"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoComplete="family-name"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2 text-sm">
                  Email
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2 text-sm">
                  Password
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text className="text-gray-400 text-xs mt-2">
                  Must be at least 6 characters
                </Text>
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
                onPress={() => router.push("/(auth)/signin")}
                activeOpacity={0.7}
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

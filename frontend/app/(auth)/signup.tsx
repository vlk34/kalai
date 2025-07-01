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
import { supabase } from "@/scripts/supabase";
import { router } from "expo-router";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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
      router.replace("/(tabs)");
    }
    setLoading(false);
  }

  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) Alert.alert("Error", error.message);
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 mt-14"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="flex-1 justify-center px-6 py-12"
        >
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </Text>
            <Text className="text-gray-600 text-base">
              Sign up to get started with Kalai
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-5">
            {/* Name Fields */}
            <View className="flex-row gap-2 space-x-3 mb-2">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">
                  First Name
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900 shadow-sm"
                  placeholder="First name"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoComplete="given-name"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">
                  Last Name
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900 shadow-sm"
                  placeholder="Last name"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoComplete="family-name"
                />
              </View>
            </View>

            <View className="mb-2">
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900 shadow-sm"
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View className="mb-2">
              <Text className="text-gray-700 font-medium mb-2">Password</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900 shadow-sm"
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <Text className="text-gray-500 text-sm mt-2">
                Must be at least 6 characters
              </Text>
            </View>

            <TouchableOpacity
              className={`bg-gray-900 rounded-xl py-4 mt-6 shadow-sm ${loading ? "opacity-70" : ""}`}
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

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-gray-500 text-sm">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Google Sign Up */}
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-xl py-4 shadow-sm"
              onPress={signInWithGoogle}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text className="text-gray-900 text-center font-medium text-base">
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Sign In Link */}
            <TouchableOpacity
              className="mt-6"
              onPress={() => router.push("/signin")}
              activeOpacity={0.7}
            >
              <Text className="text-center text-gray-600">
                Already have an account?{" "}
                <Text className="text-gray-900 font-semibold">Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

"use client";

import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Text,
} from "react-native";
import { supabase } from "@/scripts/supabase";
import { router } from "expo-router";

export default function SignIn() {
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

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Error", error.message);
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
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="flex-1 justify-center px-6"
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </Text>
          <Text className="text-gray-600 text-base">
            Sign in to continue to your account
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-5">
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
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            className={`bg-gray-900 rounded-xl py-4 mt-6 shadow-sm ${loading ? "opacity-70" : ""}`}
            onPress={signInWithEmail}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-500 text-sm">or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Google Sign In */}
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

          {/* Sign Up Link */}
          <TouchableOpacity
            className="mt-6"
            onPress={() => router.push("/signup")}
            activeOpacity={0.7}
          >
            <Text className="text-center text-gray-600">
              Don't have an account?{" "}
              <Text className="text-gray-900 font-semibold">Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

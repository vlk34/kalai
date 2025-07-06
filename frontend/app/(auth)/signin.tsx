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
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/scripts/supabase";
import { router } from "expo-router";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(30));

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
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
      router.replace("/");
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
                Welcome back
              </Text>
              <Text className="text-gray-500 text-base">
                Sign in to continue to your account
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-5">
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
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
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
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {/* Sign Up Link */}
              <TouchableOpacity
                className="mt-6"
                onPress={() => router.push("/(auth)/signup")}
                activeOpacity={0.7}
              >
                <Text className="text-center text-gray-500 text-sm">
                  Don't have an account?{" "}
                  <Text className="text-black font-semibold">Sign up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

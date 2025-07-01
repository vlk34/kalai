import React, { useState } from "react";
import {
  Alert,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { supabase } from "@/scripts/supabase";
import { router } from "expo-router";

interface AuthProps {
  mode: "signin" | "signup";
}

export function Auth({ mode }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert("Error", error.message);
    else router.replace("/(tabs)");
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) Alert.alert("Error", error.message);
    else if (!session)
      Alert.alert("Success", "Please check your inbox for email verification!");
    else router.replace("/(tabs)");
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
    <View className="flex-1 bg-white p-6">
      <View className="space-y-4">
        <View>
          <ThemedText className="mb-2 text-red-500">Email</ThemedText>
          <TextInput
            className="rounded-lg border border-gray-300 bg-white px-4 py-2"
            onChangeText={setEmail}
            value={email}
            placeholder="email@address.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View>
          <ThemedText className="mb-2 text-gray-700">Password</ThemedText>
          <TextInput
            className="rounded-lg border border-gray-300 bg-white px-4 py-2"
            onChangeText={setPassword}
            value={password}
            secureTextEntry
            placeholder="Your password"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          className="mt-4 rounded-lg bg-black py-3"
          onPress={mode === "signin" ? signInWithEmail : signUpWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText className="text-center text-white">
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </ThemedText>
          )}
        </TouchableOpacity>

        <View className="my-4 flex-row items-center">
          <View className="flex-1 border-t border-gray-300" />
          <ThemedText className="mx-4 text-gray-500">or</ThemedText>
          <View className="flex-1 border-t border-gray-300" />
        </View>

        <TouchableOpacity
          className="rounded-lg border border-gray-300 bg-white py-3"
          onPress={signInWithGoogle}
          disabled={loading}
        >
          <ThemedText className="text-center text-black">
            Continue with Google
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4"
          onPress={() => router.push(mode === "signin" ? "/signup" : "/signin")}
        >
          <ThemedText className="text-center text-gray-600">
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

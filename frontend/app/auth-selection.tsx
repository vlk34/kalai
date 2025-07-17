"use client";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import React, { useState } from "react";
import { supabase } from "@/scripts/supabase";
import {
  GoogleSignin,
  statusCodes,
  GoogleSigninButton,
} from "@react-native-google-signin/google-signin";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

// Configure Google Sign-In at the top level of the component or in a useEffect
GoogleSignin.configure({
  webClientId:
    "698517695910-2mp1gtg4g4r9rfl47v6q4tc86i2nkd5o.apps.googleusercontent.com", // <-- Replace with your actual Web client ID
  scopes: ["profile", "email"],
});

export default function AuthSelectionScreen() {
  const { t } = useTranslation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [isNavigatingToSignup, setIsNavigatingToSignup] = useState(false);
  const [isNavigatingToSignin, setIsNavigatingToSignin] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  const handleGoogleSignup = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log(userInfo);
      const idToken = userInfo?.data?.idToken;
      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (error) Alert.alert("Error", error.message);
        setTimeout(() => {
          try {
            router.replace("/");
          } catch (error) {
            console.error("Navigation error on sign in:", error);
          }
        }, 100);
      } else {
        throw new Error("No ID token present!");
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
      } else {
        Alert.alert("Error", error.message || "Google sign-in failed");
      }
    } finally {
      setIsGoogleLoading(false);
    }
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
              {t("auth.loginOrSignup")}
            </Text>
            {/* Subtitle */}
            <Text className="text-sm text-gray-500 text-center mb-8 leading-5 px-4">
              {t("auth.selectMethodSubtitle")}
            </Text>
            {/* Continue with Email Button */}
            <TouchableOpacity
              onPress={handleEmailSignup}
              className={`bg-black rounded-2xl py-4 mb-4 ${
                isNavigatingToSignup ? "opacity-50" : ""
              }`}
              activeOpacity={0.8}
              disabled={isNavigatingToSignup}
            >
              <Text className="text-white font-semibold text-base text-center">
                {t("auth.signUpWithEmail")}
              </Text>
            </TouchableOpacity>
            {/* Google Button - Now matches the email button styling */}
            <TouchableOpacity
              onPress={handleGoogleSignup}
              className={`bg-white border border-gray-300 rounded-2xl py-4 mb-4 ${
                isGoogleLoading ? "opacity-50" : ""
              }`}
              activeOpacity={0.8}
              disabled={isGoogleLoading}
            >
              <View className="flex-row items-center justify-center">
                <Svg
                  width={20}
                  height={20}
                  viewBox="0 0 48 48"
                  style={{ marginRight: 8 }}
                >
                  <Path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <Path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  />
                  <Path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  />
                  <Path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </Svg>
                <Text className="text-gray-700 font-semibold text-base">
                  {isGoogleLoading
                    ? t("auth.signingIn")
                    : t("auth.continueWithGoogle")}
                </Text>
              </View>
            </TouchableOpacity>
            {/* Already have account */}
            <TouchableOpacity
              onPress={handleSignIn}
              className={`mb-4 ${isNavigatingToSignin ? "opacity-50" : ""}`}
              activeOpacity={0.7}
              disabled={isNavigatingToSignin}
            >
              <Text className="text-center text-gray-600 text-sm">
                {t("auth.alreadyHaveAccountQuestion")}{" "}
                <Text className="text-black font-semibold">
                  {t("auth.signInLink")}
                </Text>
              </Text>
            </TouchableOpacity>
            {/* Terms and Privacy */}
            <Text className="text-xs text-gray-400 mb-4 text-center leading-4 px-4">
              {t("auth.termsText")}{" "}
              <Text className="underline">{t("auth.termsAndConditions")}</Text>{" "}
              {t("auth.and")}{" "}
              <Text className="underline">{t("auth.privacyPolicy")}</Text>{" "}
              {t("auth.willApply")}
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

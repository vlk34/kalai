"use client";

import { Stack } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Text,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome, Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAnalyzeFood } from "@/hooks/useAnalyzeFood";

export default function TabLayout() {
  const [showActionModal, setShowActionModal] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const buttonAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const bgOpacityAnim = useRef(new Animated.Value(0)).current;
  const { isAnalyzing, analysisResult, analyzeFood } = useAnalyzeFood();

  // Request permissions when component mounts
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to make this work!"
        );
      }
    })();
  }, []);

  // Simple animation for modal
  const showModal = () => {
    setShowActionModal(true);
    Animated.parallel([
      Animated.spring(modalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(bgOpacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
      Animated.timing(bgOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start(() => setShowActionModal(false));
  };

  // Handle button visibility animation
  useEffect(() => {
    // Debug: log pathname to see actual values
    console.log("Current pathname:", pathname);

    // Show button only on index page, hide on all other pages
    const isOnIndexPage =
      pathname === "/(tabs)" ||
      pathname === "/(tabs)/" ||
      pathname === "/(tabs)/index" ||
      pathname?.endsWith("/index") ||
      !pathname || // fallback for initial load
      pathname === "/";

    console.log("Is on index page:", isOnIndexPage);

    Animated.spring(buttonAnim, {
      toValue: isOnIndexPage ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();
  }, [pathname]);

  const isOnIndexPage =
    pathname === "/(tabs)" ||
    pathname === "/(tabs)/" ||
    pathname === "/(tabs)/index" ||
    pathname?.endsWith("/index") ||
    !pathname ||
    pathname === "/";

  const handleCameraPress = () => {
    hideModal();
    router.push("/camera");
  };

  const handleGalleryPress = async () => {
    hideModal();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        setCapturedPhoto(result.assets[0].uri);
        await analyzeFood(result.assets[0].uri);
        setShowResults(true);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to pick an image from gallery. Please try again."
      );
    }
  };

  const handleAddToLog = () => {
    setShowResults(false);
    setCapturedPhoto(null);
    router.push("/(tabs)");
  };

  const handleTakeAnother = () => {
    setShowResults(false);
    setCapturedPhoto(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        {/* <Stack.Screen name="edit-profile" /> */}
      </Stack>

      {/* Floating Plus Button */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: insets.bottom + 30,
          left: "50%",
          marginLeft: -30,
          opacity: buttonAnim,
          transform: [
            {
              translateY: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
          zIndex: isOnIndexPage ? 1000 : -1,
          pointerEvents: isOnIndexPage ? "auto" : "none",
        }}
      >
        <TouchableOpacity
          onPress={showModal}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "#000000",
            justifyContent: "center",
            alignItems: "center",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
            borderWidth: 4,
            borderColor: "white",
          }}
        >
          <Feather name="plus" size={28} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={hideModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={hideModal}
          style={{ flex: 1 }}
        >
          {/* Separate background overlay */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              opacity: bgOpacityAnim,
            }}
          />

          {/* Modal content */}
          <View style={{ flex: 1, overflow: "hidden" }}>
            <Animated.View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [400, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View className="bg-white rounded-t-3xl p-6">
                  {/* Header */}
                  <View className="items-center mb-6">
                    <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
                    <Text className="text-2xl font-bold text-black mb-2">
                      Add Food
                    </Text>
                    <Text className="text-gray-600 text-center">
                      Choose how you'd like to log your meal
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="space-y-0">
                    {/* Camera Button */}
                    <TouchableOpacity
                      onPress={handleCameraPress}
                      className="flex-row items-center py-4 px-2"
                    >
                      <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
                        <FontAwesome name="camera" size={20} color="#374151" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-black">
                          Camera
                        </Text>
                        <Text className="text-sm text-gray-600">
                          Take a photo of your meal
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="h-px bg-gray-200 mx-2" />

                    {/* Gallery Button */}
                    <TouchableOpacity
                      onPress={handleGalleryPress}
                      className="flex-row items-center py-4 px-2"
                    >
                      <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
                        <MaterialIcons
                          name="photo-library"
                          size={20}
                          color="#374151"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-black">
                          Gallery
                        </Text>
                        <Text className="text-sm text-gray-600">
                          Choose from your photos
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="h-px bg-gray-200 mx-2" />

                    {/* Describe Food Button */}
                    <TouchableOpacity className="flex-row items-center py-4 px-2">
                      <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
                        <Feather name="edit-3" size={20} color="#374151" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-black">
                          Describe Food
                        </Text>
                        <Text className="text-sm text-gray-600">
                          Manually enter meal details
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Results Modal */}
      <Modal visible={showResults} transparent animationType="slide">
        <View className="flex-1 bg-black/30 bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-96">
            {/* Header */}
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-2xl font-bold text-black mb-2">
                Meal Analyzed
              </Text>
              <Text className="text-gray-600 text-center">
                Here's what we found in your photo
              </Text>
            </View>

            {/* Food Info */}
            {analysisResult && (
              <View className="mb-6">
                <View className="flex-row items-center justify-center mb-4">
                  <Text className="text-3xl mr-3">
                    {analysisResult.emoji || "🍽️"}
                  </Text>
                  <Text className="text-xl font-semibold text-black">
                    {analysisResult.name || "Unknown Food"}
                  </Text>
                </View>

                {/* Nutrition Grid */}
                <View className="bg-gray-50 rounded-2xl p-4">
                  <Text className="text-sm font-medium text-gray-600 mb-3 text-center">
                    NUTRITION BREAKDOWN
                  </Text>
                  <View className="flex-row justify-between">
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-black">
                        {Math.round(analysisResult.calories || 0)}
                      </Text>
                      <Text className="text-xs text-gray-600">Calories</Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-black">
                        {Math.round(analysisResult.protein || 0)}g
                      </Text>
                      <Text className="text-xs text-gray-600">Protein</Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-black">
                        {Math.round(analysisResult.carbs || 0)}g
                      </Text>
                      <Text className="text-xs text-gray-600">Carbs</Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-black">
                        {Math.round(analysisResult.fats || 0)}g
                      </Text>
                      <Text className="text-xs text-gray-600">Fat</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handleTakeAnother}
                className="flex-1 bg-gray-100 rounded-2xl py-4 items-center"
              >
                <Text className="text-black font-semibold">Take Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddToLog}
                className="flex-1 bg-black rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-semibold">Add to Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading overlay */}
      {isAnalyzing && (
        <View className="absolute inset-0 bg-black/30 bg-opacity-80 justify-center items-center">
          <View className="bg-white rounded-3xl p-8 mx-8 items-center max-w-sm">
            <View className="mb-6">
              <ActivityIndicator size="large" color="#000" />
            </View>
            <Text className="text-xl font-bold text-center mb-3 text-black">
              Analyzing Meal
            </Text>
            <Text className="text-center text-gray-600 text-base leading-6">
              Processing nutrition information...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

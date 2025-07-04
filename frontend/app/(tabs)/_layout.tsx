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
import { useMutateRecentMeals } from "@/hooks/useMutateRecentMeals";
import { useMutateNutrition } from "@/hooks/useMutateNutrition";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateForAPI } from "@/hooks/useUserProfile";
import { useQueryClient } from "@tanstack/react-query";

export default function TabLayout() {
  const [showActionModal, setShowActionModal] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const buttonAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const bgOpacityAnim = useRef(new Animated.Value(0)).current;
  const { analyzeFood } = useAnalyzeFood();
  const { addOptimisticMeal, updateOptimisticMeal } = useMutateRecentMeals();
  const { addMealToNutrition } = useMutateNutrition();
  const { session } = useAuth();
  const queryClient = useQueryClient();

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

  // Determine if we're on the index page
  const isOnIndexPage =
    pathname === "/(tabs)" ||
    pathname === "/(tabs)/" ||
    pathname === "/(tabs)/index" ||
    pathname?.endsWith("/index") ||
    !pathname || // fallback for initial load
    pathname === "/";

  // Handle button visibility animation
  useEffect(() => {
    Animated.timing(buttonAnim, {
      toValue: isOnIndexPage ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  }, [pathname]);

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
        const photoUri = result.assets[0].uri;

        // Create optimistic meal entry
        const optimisticMeal = {
          id: `temp-${Date.now()}`,
          name: "Analyzing...",
          emoji: "🍽️",
          protein: 0,
          carbs: 0,
          fats: 0,
          calories: 0,
          created_at: new Date().toISOString(),
          photo_url: photoUri,
          isAnalyzing: true,
        };

        // Add to recent meals optimistically
        const today = formatDateForAPI(new Date());
        addOptimisticMeal(optimisticMeal, today);

        // Navigate back to main screen immediately
        // router.push("/(tabs)");

        // Start analysis in background
        try {
          const result = await analyzeFood(photoUri);

          // Extract the real data from server response
          const serverData = result.data;
          const databaseRecord = serverData.database_record;
          const photoUrl = serverData.file_info?.photo_url;

          // Replace the optimistic meal with real server data
          updateOptimisticMeal(
            optimisticMeal.id,
            {
              id: databaseRecord.id, // Replace temp ID with real ID
              name: databaseRecord.name,
              emoji: databaseRecord.emoji,
              protein: databaseRecord.protein,
              carbs: databaseRecord.carbs,
              fats: databaseRecord.fats,
              calories: databaseRecord.calories,
              photo_url: photoUrl || optimisticMeal.photo_url, // Use server photo URL
              created_at: databaseRecord.created_at,
              isAnalyzing: false,
            },
            today
          );

          // Optimistically update nutrition with the real meal data
          addMealToNutrition(
            {
              calories: databaseRecord.calories,
              protein: databaseRecord.protein,
              carbs: databaseRecord.carbs,
              fats: databaseRecord.fats,
            },
            today
          );

          // Invalidate both recent meals and nutrition summary to ensure fresh data
          queryClient.invalidateQueries({
            queryKey: ["recent-meals", session?.user?.id, today],
          });
          queryClient.invalidateQueries({
            queryKey: ["daily-nutrition-summary", session?.user?.id, today],
          });
        } catch (error) {
          console.error("Analysis failed:", error);
          // Update with error state
          updateOptimisticMeal(
            optimisticMeal.id,
            {
              name: "Analysis Failed",
              emoji: "❌",
              protein: 0,
              carbs: 0,
              fats: 0,
              calories: 0,
              isAnalyzing: false,
            },
            today
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to pick an image from gallery. Please try again."
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[id]" />
        {/* <Stack.Screen name="edit-profile" /> */}
      </Stack>

      {/* Floating Plus Button */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: insets.bottom + 30,
          left: "50%",
          marginLeft: -30,
          transform: [
            {
              translateY: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [15, 0],
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
                    {/* <TouchableOpacity className="flex-row items-center py-4 px-2">
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
                    </TouchableOpacity> */}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

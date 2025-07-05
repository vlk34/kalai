"use client";
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Alert,
  Keyboard,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useMutateRecentMeals } from "@/hooks/useMutateRecentMeals";
import { useMutateNutrition } from "@/hooks/useMutateNutrition";
import { formatDateForAPI } from "@/hooks/useUserProfile";

// API call function for saving edited meal data
const editConsumedFood = async (
  accessToken: string,
  foodId: string,
  data: {
    name?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  }
) => {
  const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

  const response = await fetch(`${API_BASE_URL}/edit_consumed_food`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      food_id: foodId,
      ...data,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`
    );
  }

  return response.json();
};

// API call function for deleting a meal
const deleteConsumedFood = async (accessToken: string, foodId: string) => {
  const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

  const response = await fetch(`${API_BASE_URL}/delete_consumed_food`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      food_id: foodId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`
    );
  }

  return response.json();
};

export default function EditMealScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { invalidateRecentMeals, updateOptimisticMeal, removeOptimisticMeal } =
    useMutateRecentMeals();
  const { removeMealFromNutrition, updateOptimisticNutrition } =
    useMutateNutrition();
  const {
    id,
    name,
    photo_url,
    calories,
    protein,
    carbs,
    fats,
    portions,
    selectedDate,
  } = useLocalSearchParams();

  // Add a ref to track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [editedName, setEditedName] = useState(name as string);
  const [editedCalories, setEditedCalories] = useState(calories as string);
  const [editedPortions, setEditedPortions] = useState(
    (portions as string) || "1"
  );
  const [editedCarbs, setEditedCarbs] = useState(carbs as string);
  const [editedProtein, setEditedProtein] = useState(protein as string);
  const [editedFats, setEditedFats] = useState(fats as string);
  const [isSaving, setIsSaving] = useState(false);

  // Base values for portion calculations
  const [basePortion, setBasePortion] = useState(1.0);
  const [baseCalories, setBaseCalories] = useState(
    Number.parseFloat(calories as string) || 0
  );
  const [baseProtein, setBaseProtein] = useState(
    Number.parseFloat(protein as string) || 0
  );
  const [baseCarbs, setBaseCarbs] = useState(
    Number.parseFloat(carbs as string) || 0
  );
  const [baseFats, setBaseFats] = useState(
    Number.parseFloat(fats as string) || 0
  );

  // Error states for validation feedback
  const [errors, setErrors] = useState({
    name: false,
    calories: false,
    protein: false,
    carbs: false,
    fats: false,
  });

  // Animation refs
  const menuPositionAnim = useRef(new Animated.Value(0)).current; // 0 = normal position

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        // Move menu up by keyboard height
        Animated.timing(menuPositionAnim, {
          toValue: -keyboardHeight,
          duration: Platform.OS === "ios" ? event.duration : 200,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (event) => {
        // Move menu back to original position
        Animated.timing(menuPositionAnim, {
          toValue: 0,
          duration: Platform.OS === "ios" ? event.duration : 150,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [menuPositionAnim]);

  const handleBack = () => {
    if (isMounted.current) {
      router.back();
    }
  };

  const updatePortionValues = (newPortion: number) => {
    const multiplier = newPortion / basePortion;
    setEditedCalories((baseCalories * multiplier).toFixed(0));
    setEditedProtein((baseProtein * multiplier).toFixed(1));
    setEditedCarbs((baseCarbs * multiplier).toFixed(1));
    setEditedFats((baseFats * multiplier).toFixed(1));
    setEditedPortions(newPortion.toFixed(2));
  };

  const handlePortionIncrease = () => {
    const currentPortion = Number.parseFloat(editedPortions) || 1.0;
    const newPortion = Math.min(currentPortion + 0.25, 10.0); // Max 10 portions
    updatePortionValues(newPortion);
  };

  const handlePortionDecrease = () => {
    const currentPortion = Number.parseFloat(editedPortions) || 1.0;
    const newPortion = Math.max(currentPortion - 0.25, 0.25); // Min 0.25 portions
    updatePortionValues(newPortion);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!session?.access_token) {
              return;
            }

            try {
              // Get current date for optimistic update
              const targetDate =
                (selectedDate as string) || formatDateForAPI(new Date());
              console.log("Using target date for delete:", targetDate);

              // Get meal data for nutrition update
              const mealData = {
                calories: parseFloat(calories as string) || 0,
                protein: parseFloat(protein as string) || 0,
                carbs: parseFloat(carbs as string) || 0,
                fats: parseFloat(fats as string) || 0,
              };

              // Apply optimistic updates FIRST
              console.log("Applying optimistic delete updates for meal:", id);
              removeOptimisticMeal(id as string, targetDate);
              removeMealFromNutrition(mealData, targetDate);

              // Then navigate back
              if (isMounted.current) {
                router.back();
              }

              // Make API call in background
              const result = await deleteConsumedFood(
                session.access_token,
                id as string
              );

              if (!result.success) {
                // If API call failed, invalidate to revert optimistic updates
                invalidateRecentMeals(targetDate);
                queryClient.invalidateQueries({
                  queryKey: [
                    "daily-nutrition-summary",
                    session?.user?.id,
                    targetDate,
                  ],
                });
              }
            } catch (error: any) {
              console.error("Delete error:", error);
              // If there was an error, invalidate to revert optimistic updates
              const targetDate =
                (selectedDate as string) || formatDateForAPI(new Date());
              invalidateRecentMeals(targetDate);
              queryClient.invalidateQueries({
                queryKey: [
                  "daily-nutrition-summary",
                  session?.user?.id,
                  targetDate,
                ],
              });
              Alert.alert(
                "Error",
                "Failed to delete meal. Please try again later."
              );
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!session?.access_token) {
      return;
    }

    // Reset all errors
    setErrors({
      name: false,
      calories: false,
      protein: false,
      carbs: false,
      fats: false,
    });

    setIsSaving(true);

    try {
      // Validate all fields and collect errors
      const validationErrors = {
        name: false,
        calories: false,
        protein: false,
        carbs: false,
        fats: false,
      };

      // Prepare data for API call
      const saveData: any = {};

      // Validate name
      if (!editedName || editedName.trim().length === 0) {
        validationErrors.name = true;
      } else {
        saveData.name = editedName.trim();
      }

      // Validate calories
      const caloriesValue = parseFloat(editedCalories);
      if (isNaN(caloriesValue) || caloriesValue < 0) {
        validationErrors.calories = true;
      } else {
        saveData.calories = caloriesValue;
      }

      // Validate protein
      const proteinValue = parseFloat(editedProtein);
      if (isNaN(proteinValue) || proteinValue < 0) {
        validationErrors.protein = true;
      } else {
        saveData.protein = proteinValue;
      }

      // Validate carbs
      const carbsValue = parseFloat(editedCarbs);
      if (isNaN(carbsValue) || carbsValue < 0) {
        validationErrors.carbs = true;
      } else {
        saveData.carbs = carbsValue;
      }

      // Validate fats
      const fatsValue = parseFloat(editedFats);
      if (isNaN(fatsValue) || fatsValue < 0) {
        validationErrors.fats = true;
      } else {
        saveData.fats = fatsValue;
      }

      // Check if there are any validation errors
      const hasErrors = Object.values(validationErrors).some((error) => error);
      if (hasErrors) {
        setErrors(validationErrors);
        setIsSaving(false);
        return;
      }

      // Check if there are any changes to save
      if (Object.keys(saveData).length === 0) {
        setIsSaving(false);
        return;
      }

      // Get current date for optimistic update
      const targetDate =
        (selectedDate as string) || formatDateForAPI(new Date());
      console.log("Using target date for save:", targetDate);

      // Calculate the difference in nutrition values
      const oldMealData = {
        calories: parseFloat(calories as string) || 0,
        protein: parseFloat(protein as string) || 0,
        carbs: parseFloat(carbs as string) || 0,
        fats: parseFloat(fats as string) || 0,
      };

      const newMealData = {
        calories: saveData.calories || 0,
        protein: saveData.protein || 0,
        carbs: saveData.carbs || 0,
        fats: saveData.fats || 0,
      };

      // Calculate the difference
      const nutritionDiff = {
        calories: newMealData.calories - oldMealData.calories,
        protein: newMealData.protein - oldMealData.protein,
        carbs: newMealData.carbs - oldMealData.carbs,
        fats: newMealData.fats - oldMealData.fats,
      };

      // Apply optimistic updates FIRST
      console.log("Applying optimistic save updates for meal:", id, saveData);
      updateOptimisticMeal(id as string, saveData, targetDate);
      updateOptimisticNutrition(nutritionDiff, targetDate);

      // Then navigate back
      if (isMounted.current) {
        router.back();
      }

      // Call the API in background
      const result = await editConsumedFood(
        session.access_token,
        id as string,
        saveData
      );

      if (!result.success) {
        // If API call failed, invalidate to revert optimistic updates
        invalidateRecentMeals(targetDate);
        queryClient.invalidateQueries({
          queryKey: ["daily-nutrition-summary", session?.user?.id, targetDate],
        });
      }
    } catch (error: any) {
      console.error("Save error:", error);
      // If there was an error, invalidate to revert optimistic updates
      const targetDate =
        (selectedDate as string) || formatDateForAPI(new Date());
      invalidateRecentMeals(targetDate);
      queryClient.invalidateQueries({
        queryKey: ["daily-nutrition-summary", session?.user?.id, targetDate],
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Image Section - 40% of screen */}
      <View style={{ height: "40%" }} className="relative">
        <Image
          source={{ uri: photo_url as string }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Top Bar Overlay */}
        <View className="absolute top-0 left-0 right-0 z-10">
          <SafeAreaView>
            <View className="flex-row justify-between items-center px-4 py-2">
              {/* Back Button */}
              <TouchableOpacity
                onPress={handleBack}
                className="bg-white/20 backdrop-blur-sm rounded-full p-2"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
              >
                <Feather name="arrow-left" size={24} color="black" />
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={handleDelete}
                className="bg-white/20 backdrop-blur-sm rounded-full p-2"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
              >
                <MaterialIcons name="delete" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>

      {/* Overlaid Menu Section - positioned to overlay on image with keyboard animation */}
      <Animated.View
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
        style={{
          top: "30%", // Start at 25% instead of 40% to overlay on image
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
          transform: [{ translateY: menuPositionAnim }],
        }}
      >
        <View className="flex-1 px-6 py-4">
          {/* Drag Handle */}
          <View className="items-center mb-4">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Meal Name - Editable */}
          <View className="mb-4">
            <TextInput
              value={editedName}
              onChangeText={(text) => {
                setEditedName(text);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: false }));
                }
              }}
              className={`text-xl font-bold text-black border-b pb-2 ${
                errors.name ? "border-red-500" : "border-gray-200"
              }`}
              placeholder="Meal name"
              multiline={false}
            />
            {errors.name && (
              <Text className="text-red-500 text-sm mt-1">
                Meal name cannot be empty
              </Text>
            )}
          </View>

          {/* Calories and Portions Row */}
          <View className="flex-row gap-3 mb-4">
            {/* Calories */}
            <View className="flex-1">
              <Text className="text-sm text-gray-500 mb-1">Calories</Text>
              <View
                className={`flex-row items-center rounded-xl px-3 py-2 ${
                  errors.calories
                    ? "bg-red-50 border border-red-500"
                    : "bg-gray-50"
                }`}
              >
                <TextInput
                  value={editedCalories}
                  onChangeText={(text) => {
                    setEditedCalories(text);
                    if (errors.calories) {
                      setErrors((prev) => ({ ...prev, calories: false }));
                    }
                  }}
                  className="flex-1 text-base font-semibold text-black"
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Feather name="edit-2" size={14} color="#9ca3af" />
              </View>
              {errors.calories && (
                <Text className="text-red-500 text-xs mt-1">
                  Enter a valid number ≥ 0
                </Text>
              )}
            </View>

            {/* Portions */}
            <View className="flex-1">
              <Text className="text-sm text-gray-500 mb-1">Portions</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2 h-16">
                <TouchableOpacity
                  onPress={handlePortionDecrease}
                  className="p-1"
                >
                  <Feather name="minus" size={16} color="#6b7280" />
                </TouchableOpacity>
                <Text className="flex-1 text-base font-semibold text-black text-center">
                  {Number.parseFloat(editedPortions).toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={handlePortionIncrease}
                  className="p-1"
                >
                  <Feather name="plus" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Carbs Row */}
          <View className="mb-3">
            <Text className="text-sm text-gray-500 mb-1">Carbs</Text>
            <View
              className={`flex-row items-center rounded-xl px-3 py-2 ${
                errors.carbs ? "bg-red-50 border border-red-500" : "bg-gray-50"
              }`}
            >
              <View className="bg-orange-100 rounded-full flex-row items-center gap-1 px-2 py-1 mr-2">
                <Text className="text-xs font-medium text-orange-600">C</Text>
              </View>
              <TextInput
                value={editedCarbs}
                onChangeText={(text) => {
                  setEditedCarbs(text);
                  if (errors.carbs) {
                    setErrors((prev) => ({ ...prev, carbs: false }));
                  }
                }}
                className="flex-1 text-base font-semibold text-black"
                keyboardType="numeric"
                placeholder="0"
              />
              <Text className="text-gray-500 mr-2">g</Text>
              <Feather name="edit-2" size={14} color="#9ca3af" />
            </View>
            {errors.carbs && (
              <Text className="text-red-500 text-xs mt-1">
                Enter a valid number ≥ 0
              </Text>
            )}
          </View>

          {/* Protein Row */}
          <View className="mb-3">
            <Text className="text-sm text-gray-500 mb-1">Protein</Text>
            <View
              className={`flex-row items-center rounded-xl px-3 py-2 ${
                errors.protein
                  ? "bg-red-50 border border-red-500"
                  : "bg-gray-50"
              }`}
            >
              <View className="bg-rose-100 rounded-full flex-row items-center gap-1 px-2 py-1 mr-2">
                <Text className="text-xs font-medium text-rose-600">P</Text>
              </View>
              <TextInput
                value={editedProtein}
                onChangeText={(text) => {
                  setEditedProtein(text);
                  if (errors.protein) {
                    setErrors((prev) => ({ ...prev, protein: false }));
                  }
                }}
                className="flex-1 text-base font-semibold text-black"
                keyboardType="numeric"
                placeholder="0"
              />
              <Text className="text-gray-500 mr-2">g</Text>
              <Feather name="edit-2" size={14} color="#9ca3af" />
            </View>
            {errors.protein && (
              <Text className="text-red-500 text-xs mt-1">
                Enter a valid number ≥ 0
              </Text>
            )}
          </View>

          {/* Fats Row */}
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Fats</Text>
            <View
              className={`flex-row items-center rounded-xl px-3 py-2 ${
                errors.fats ? "bg-red-50 border border-red-500" : "bg-gray-50"
              }`}
            >
              <View className="bg-sky-100 rounded-full flex-row items-center gap-1 px-2 py-1 mr-2">
                <Text className="text-xs font-medium text-sky-600">F</Text>
              </View>
              <TextInput
                value={editedFats}
                onChangeText={(text) => {
                  setEditedFats(text);
                  if (errors.fats) {
                    setErrors((prev) => ({ ...prev, fats: false }));
                  }
                }}
                className="flex-1 text-base font-semibold text-black"
                keyboardType="numeric"
                placeholder="0"
              />
              <Text className="text-gray-500 mr-2">g</Text>
              <Feather name="edit-2" size={14} color="#9ca3af" />
            </View>
            {errors.fats && (
              <Text className="text-red-500 text-xs mt-1">
                Enter a valid number ≥ 0
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row">
            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className={`flex-1 rounded-xl py-3 flex-row items-center justify-center ${
                isSaving ? "bg-gray-400" : "bg-green-500"
              }`}
            >
              <MaterialIcons
                name="save"
                size={16}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white font-semibold text-base">
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

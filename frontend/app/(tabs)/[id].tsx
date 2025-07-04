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
  const { id, name, photo_url, calories, protein, carbs, fats, portions } =
    useLocalSearchParams();

  // Store original values for revert functionality
  const originalValues = {
    name: name as string,
    calories: calories as string,
    portions: (portions as string) || "1",
    carbs: carbs as string,
    protein: protein as string,
    fats: fats as string,
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const [editedName, setEditedName] = useState(name as string);
  const [editedCalories, setEditedCalories] = useState(calories as string);
  const [editedPortions, setEditedPortions] = useState(
    (portions as string) || "1"
  );
  const [editedCarbs, setEditedCarbs] = useState(carbs as string);
  const [editedProtein, setEditedProtein] = useState(protein as string);
  const [editedFats, setEditedFats] = useState(fats as string);
  const [isSaving, setIsSaving] = useState(false);

  // Error states for validation feedback
  const [errors, setErrors] = useState({
    name: false,
    calories: false,
    protein: false,
    carbs: false,
    fats: false,
  });

  // Animation refs
  const dropdownAnim = useRef(new Animated.Value(0)).current;
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
    router.back();
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    Animated.timing(dropdownAnim, {
      toValue: showDropdown ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleRevert = () => {
    Alert.alert(
      "Revert Changes",
      "Are you sure you want to revert all changes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revert",
          onPress: () => {
            setEditedName(originalValues.name);
            setEditedCalories(originalValues.calories);
            setEditedPortions(originalValues.portions);
            setEditedCarbs(originalValues.carbs);
            setEditedProtein(originalValues.protein);
            setEditedFats(originalValues.fats);
            setShowDropdown(false);
          },
        },
      ]
    );
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
              const result = await deleteConsumedFood(
                session.access_token,
                id as string
              );

              if (result.success) {
                // Invalidate relevant queries to refresh data
                queryClient.invalidateQueries({
                  queryKey: ["recently-eaten"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["daily-nutrition-summary"],
                });

                router.back();
              }
            } catch (error: any) {
              console.error("Delete error:", error);
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

  const handleFixResult = () => {
    Alert.alert(
      "Fix Result",
      "AI analysis will be performed to improve the nutrition data."
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

      // Prepare data for API call - only include changed values
      const saveData: any = {};

      // Validate name
      if (editedName !== originalValues.name) {
        if (!editedName || editedName.trim().length === 0) {
          validationErrors.name = true;
        } else {
          saveData.name = editedName.trim();
        }
      }

      // Validate calories
      if (editedCalories !== originalValues.calories) {
        const caloriesValue = parseFloat(editedCalories);
        if (isNaN(caloriesValue) || caloriesValue < 0) {
          validationErrors.calories = true;
        } else {
          saveData.calories = caloriesValue;
        }
      }

      // Validate protein
      if (editedProtein !== originalValues.protein) {
        const proteinValue = parseFloat(editedProtein);
        if (isNaN(proteinValue) || proteinValue < 0) {
          validationErrors.protein = true;
        } else {
          saveData.protein = proteinValue;
        }
      }

      // Validate carbs
      if (editedCarbs !== originalValues.carbs) {
        const carbsValue = parseFloat(editedCarbs);
        if (isNaN(carbsValue) || carbsValue < 0) {
          validationErrors.carbs = true;
        } else {
          saveData.carbs = carbsValue;
        }
      }

      // Validate fats
      if (editedFats !== originalValues.fats) {
        const fatsValue = parseFloat(editedFats);
        if (isNaN(fatsValue) || fatsValue < 0) {
          validationErrors.fats = true;
        } else {
          saveData.fats = fatsValue;
        }
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

      // Call the API
      const result = await editConsumedFood(
        session.access_token,
        id as string,
        saveData
      );

      if (result.success) {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({
          queryKey: ["recently-eaten"],
        });
        queryClient.invalidateQueries({
          queryKey: ["daily-nutrition-summary"],
        });

        router.back();
      }
    } catch (error: any) {
      console.error("Save error:", error);
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

              {/* Triple Dot Menu */}
              <View className="relative">
                <TouchableOpacity
                  onPress={toggleDropdown}
                  className="bg-white/20 backdrop-blur-sm rounded-full p-2"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
                >
                  <Feather name="more-vertical" size={24} color="black" />
                </TouchableOpacity>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: 45,
                      right: 0,
                      opacity: dropdownAnim,
                      transform: [
                        {
                          translateY: dropdownAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-10, 0],
                          }),
                        },
                      ],
                    }}
                    className="bg-white rounded-2xl shadow-lg py-2 min-w-[140px]"
                  >
                    <TouchableOpacity
                      onPress={handleRevert}
                      className="flex-row items-center px-4 py-3"
                    >
                      <MaterialIcons name="restore" size={20} color="#374151" />
                      <Text className="ml-3 text-gray-700 font-medium">
                        Revert
                      </Text>
                    </TouchableOpacity>

                    <View className="h-px bg-gray-200 mx-2" />

                    <TouchableOpacity
                      onPress={handleDelete}
                      className="flex-row items-center px-4 py-3"
                    >
                      <MaterialIcons name="delete" size={20} color="#ef4444" />
                      <Text className="ml-3 text-red-500 font-medium">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
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
              <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2">
                <TextInput
                  value={editedPortions}
                  onChangeText={setEditedPortions}
                  className="flex-1 text-base font-semibold text-black"
                  keyboardType="numeric"
                  placeholder="1"
                />
                <Feather name="edit-2" size={14} color="#9ca3af" />
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
          <View className="flex-row gap-2">
            {/* Fix Result Button */}
            <TouchableOpacity
              onPress={handleFixResult}
              className="flex-1 bg-black rounded-2xl py-3 flex-row items-center justify-center"
            >
              <FontAwesome5
                name="magic"
                size={16}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white font-semibold text-base">
                Fix result
              </Text>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className={`flex-1 rounded-2xl py-3 flex-row items-center justify-center ${
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

      {/* Overlay to close dropdown when tapping outside */}
      {showDropdown && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
          }}
          onPress={() => setShowDropdown(false)}
          activeOpacity={1}
        />
      )}
    </View>
  );
}

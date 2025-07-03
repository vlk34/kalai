"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome,
  Ionicons,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React from "react";
import {
  useCreateProfile,
  useCalculateTargets,
  type OnboardingData as OnboardingDataType,
} from "@/hooks/useUserProfile";

interface OnboardingData {
  gender?: string;
  activityLevel?: string;
  trackingDifficulty?: string;
  experience?: string;
  height?: number;
  weight?: number;
  unit?: "metric" | "imperial";
  dateOfBirth?: Date;
  goal?: string;
  diet?: string;
}

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({ unit: "metric" });
  const [canProceed, setCanProceed] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [dateInputText, setDateInputText] = useState("");
  const [realTimeTargets, setRealTimeTargets] = useState<any>(null);

  // API hooks
  const createProfileMutation = useCreateProfile();
  const calculateTargetsMutation = useCalculateTargets();

  const totalSteps = 9;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Initialize date input text when date exists
  useEffect(() => {
    if (data.dateOfBirth && !dateInputText) {
      setDateInputText(formatDateForDisplay(data.dateOfBirth));
    }
  }, [data.dateOfBirth]);

  // Validation for each step
  useEffect(() => {
    switch (currentStep) {
      case 0: // Gender
        setCanProceed(!!data.gender);
        break;
      case 1: // Activity Level
        setCanProceed(!!data.activityLevel);
        break;
      case 2: // Tracking Difficulty
        setCanProceed(!!data.trackingDifficulty);
        break;
      case 3: // Experience
        setCanProceed(!!data.experience);
        break;
      case 4: // Height & Weight
        setCanProceed(!!data.height && !!data.weight);
        break;
      case 5: // Date of Birth
        setCanProceed(!!data.dateOfBirth);
        break;
      case 6: // Goal
        setCanProceed(!!data.goal);
        break;
      case 7: // Diet
        setCanProceed(!!data.diet);
        break;
      default:
        setCanProceed(true);
    }
  }, [currentStep, data]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Validate that we have all required data
      if (
        !data.gender ||
        !data.activityLevel ||
        !data.trackingDifficulty ||
        !data.experience ||
        !data.height ||
        !data.weight ||
        !data.dateOfBirth ||
        !data.goal ||
        !data.diet
      ) {
        Alert.alert("Error", "Please complete all steps before finishing.");
        return;
      }

      // Convert local onboarding data to the format expected by the API
      const profileData: OnboardingDataType = {
        gender: data.gender,
        activityLevel: data.activityLevel,
        trackingDifficulty: data.trackingDifficulty,
        experience: data.experience,
        unit: data.unit || "metric",
        height: data.height,
        weight: data.weight,
        dateOfBirth: data.dateOfBirth,
        goal: data.goal,
        diet: data.diet,
      };

      console.log("Attempting to create profile with data:", profileData);

      // Create profile via API
      await createProfileMutation.mutateAsync(profileData);

      // Save onboarding completion to AsyncStorage
      await AsyncStorage.setItem("onboardingData", JSON.stringify(data));
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");

      console.log("Profile created successfully");

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error creating profile:", error);

      // Show more detailed error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      Alert.alert(
        "Profile Creation Failed",
        `Failed to create your profile. Details: ${errorMessage}\n\nYou can continue to the app and try again later from Settings.`,
        [
          { text: "Retry", style: "default", onPress: () => handleComplete() },
          {
            text: "Continue Anyway",
            style: "cancel",
            onPress: async () => {
              // Save as fallback and continue
              await AsyncStorage.setItem(
                "onboardingData",
                JSON.stringify(data)
              );
              await AsyncStorage.setItem("hasCompletedOnboarding", "true");
              router.replace("/(tabs)");
            },
          },
        ]
      );
    }
  };

  // Calculate real-time targets when we reach the final step
  const calculateRealtimeTargets = async () => {
    if (
      !data.gender ||
      !data.activityLevel ||
      !data.height ||
      !data.weight ||
      !data.dateOfBirth ||
      !data.goal ||
      !data.diet
    ) {
      return;
    }

    try {
      const profileData: OnboardingDataType = {
        gender: data.gender,
        activityLevel: data.activityLevel,
        trackingDifficulty: data.trackingDifficulty || "sometimes",
        experience: data.experience || "beginner",
        unit: data.unit || "metric",
        height: data.height,
        weight: data.weight,
        dateOfBirth: data.dateOfBirth,
        goal: data.goal,
        diet: data.diet,
      };

      const targets = await calculateTargetsMutation.mutateAsync(profileData);
      setRealTimeTargets(targets);
    } catch (error) {
      console.error("Error calculating targets:", error);
      // Fall back to simple calculation
      setRealTimeTargets(calculateFallbackRecommendations(data));
    }
  };

  const calculateFallbackRecommendations = (userData: OnboardingData) => {
    let baseCalories = 2000;
    const protein = 150;
    const carbs = 250;
    const fats = 65;

    // Adjust based on user data
    if (userData.gender === "male") baseCalories += 200;
    if (userData.activityLevel === "high") baseCalories += 300;
    if (userData.goal === "lose") baseCalories -= 300;
    if (userData.goal === "gain") baseCalories += 300;

    return {
      calories: baseCalories,
      protein_g: protein,
      carbs_g: carbs,
      fats_g: fats,
    };
  };

  const handleUnitChange = (newUnit: "metric" | "imperial") => {
    try {
      console.log("Changing unit from", data.unit, "to", newUnit);

      let newHeight = data.height;
      let newWeight = data.weight;

      if (data.unit === "metric" && newUnit === "imperial") {
        // Convert cm to inches, kg to lbs
        if (data.height) newHeight = Math.round(data.height / 2.54);
        if (data.weight) newWeight = Math.round(data.weight * 2.205);
      } else if (data.unit === "imperial" && newUnit === "metric") {
        // Convert inches to cm, lbs to kg
        if (data.height) newHeight = Math.round(data.height * 2.54);
        if (data.weight) newWeight = Math.round(data.weight / 2.205);
      }

      setData({ ...data, unit: newUnit, height: newHeight, weight: newWeight });
      console.log("Unit change completed successfully");
    } catch (error) {
      console.error("Error in handleUnitChange:", error);
    }
  };

  const parseDateString = (dateStr: string) => {
    // Parse DD.MM.YYYY format
    const parts = dateStr.split(".");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-based in Date
      const year = parseInt(parts[2], 10);

      const date = new Date(year, month, day);
      // Validate the date
      if (
        date.getDate() === day &&
        date.getMonth() === month &&
        date.getFullYear() === year
      ) {
        return date;
      }
    }
    return null;
  };

  const formatDateForDisplay = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const OptionButton = ({
    icon,
    title,
    selected,
    onPress,
  }: {
    icon: string | React.ReactNode;
    title: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center p-4 rounded-2xl mb-3 border-2 ${
        selected ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
      }`}
    >
      <Text className="text-2xl mr-4">{icon}</Text>
      <Text
        className={`text-lg font-medium flex-1 ${selected ? "text-green-700" : "text-gray-700"}`}
      >
        {title}
      </Text>
      {selected && (
        <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
          <Text className="text-white text-xs font-bold">✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Gender
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              What's your gender?
            </Text>
            <Text className="text-gray-600 mb-8">
              This helps us calculate your daily needs
            </Text>

            <OptionButton
              icon={<FontAwesome name="male" size={24} color="black" />}
              title="Male"
              selected={data.gender === "male"}
              onPress={() => setData({ ...data, gender: "male" })}
            />
            <OptionButton
              icon={<FontAwesome name="female" size={24} color="black" />}
              title="Female"
              selected={data.gender === "female"}
              onPress={() => setData({ ...data, gender: "female" })}
            />
            <OptionButton
              icon={<FontAwesome name="question" size={24} color="black" />}
              title="I prefer not to say"
              selected={data.gender === "other"}
              onPress={() => setData({ ...data, gender: "other" })}
            />
          </View>
        );

      case 1: // Activity Level
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              How active are you?
            </Text>
            <Text className="text-gray-600 mb-8">
              This affects your calorie requirements
            </Text>

            <OptionButton
              icon={<FontAwesome name="battery-1" size={24} color="black" />}
              title="Sedentary (Little to no exercise)"
              selected={data.activityLevel === "low"}
              onPress={() => setData({ ...data, activityLevel: "low" })}
            />
            <OptionButton
              icon={<FontAwesome name="battery-2" size={24} color="black" />}
              title="Lightly Active (Light exercise 1-3 days/week)"
              selected={data.activityLevel === "moderate"}
              onPress={() => setData({ ...data, activityLevel: "moderate" })}
            />
            <OptionButton
              icon={<FontAwesome name="battery-full" size={24} color="black" />}
              title="Very Active (Hard exercise 6-7 days/week)"
              selected={data.activityLevel === "high"}
              onPress={() => setData({ ...data, activityLevel: "high" })}
            />
          </View>
        );

      case 2: // Tracking Difficulty
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Have you had difficulty tracking calories?
            </Text>
            <Text className="text-gray-600 mb-8">
              We'll customize your experience accordingly
            </Text>

            <OptionButton
              icon={<Entypo name="emoji-sad" size={24} color="black" />}
              title="Yes, it's been challenging"
              selected={data.trackingDifficulty === "yes"}
              onPress={() => setData({ ...data, trackingDifficulty: "yes" })}
            />
            <OptionButton
              icon={<Entypo name="emoji-neutral" size={24} color="black" />}
              title="Sometimes, but manageable"
              selected={data.trackingDifficulty === "sometimes"}
              onPress={() =>
                setData({ ...data, trackingDifficulty: "sometimes" })
              }
            />
            <OptionButton
              icon={<Entypo name="emoji-flirt" size={24} color="black" />}
              title="No, I find it easy"
              selected={data.trackingDifficulty === "no"}
              onPress={() => setData({ ...data, trackingDifficulty: "no" })}
            />
          </View>
        );

      case 3: // Experience
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              What's your nutrition tracking experience?
            </Text>
            <Text className="text-gray-600 mb-8">
              This helps us tailor the app for you
            </Text>

            <OptionButton
              icon={<Ionicons name="leaf-outline" size={24} color="black" />}
              title="Complete beginner"
              selected={data.experience === "beginner"}
              onPress={() => setData({ ...data, experience: "beginner" })}
            />
            <OptionButton
              icon={<Feather name="book-open" size={24} color="black" />}
              title="Some experience"
              selected={data.experience === "intermediate"}
              onPress={() => setData({ ...data, experience: "intermediate" })}
            />
            <OptionButton
              icon={<Feather name="award" size={24} color="black" />}
              title="Very experienced"
              selected={data.experience === "expert"}
              onPress={() => setData({ ...data, experience: "expert" })}
            />
          </View>
        );

      case 4: // Height & Weight
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Your measurements
            </Text>
            <Text className="text-gray-600 mb-8">
              We need this to calculate your daily needs
            </Text>

            {/* Unit Toggle */}
            <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-6">
              <TouchableOpacity
                onPress={() => handleUnitChange("metric")}
                className={`flex-1 py-3 rounded-xl ${data.unit === "metric" ? "bg-white shadow-sm" : ""}`}
              >
                <Text
                  className={`text-center font-medium ${data.unit === "metric" ? "text-gray-900" : "text-gray-500"}`}
                >
                  Metric
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleUnitChange("imperial")}
                className={`flex-1 py-3 rounded-xl ${data.unit === "imperial" ? "bg-white shadow-sm" : ""}`}
              >
                <Text
                  className={`text-center font-medium ${data.unit === "imperial" ? "text-gray-900" : "text-gray-500"}`}
                >
                  Imperial
                </Text>
              </TouchableOpacity>
            </View>

            {/* Height Input */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Height ({data.unit === "metric" ? "cm" : "ft/in"})
              </Text>
              {data.unit === "metric" ? (
                <TextInput
                  className="bg-white border border-gray-200 rounded-2xl p-4 text-lg text-gray-700"
                  placeholder="Enter height in cm (e.g. 170)"
                  placeholderTextColor="#9CA3AF"
                  value={data.height?.toString() || ""}
                  onChangeText={(text) => {
                    const height = parseFloat(text);
                    if (!isNaN(height) && height > 0) {
                      setData({ ...data, height });
                    } else if (text === "") {
                      setData({ ...data, height: undefined });
                    }
                  }}
                  keyboardType="numeric"
                />
              ) : (
                <TouchableOpacity
                  onPress={() => setShowHeightPicker(true)}
                  className="bg-white border border-gray-200 rounded-2xl p-4"
                >
                  <Text className="text-lg text-gray-700">
                    {data.height
                      ? `${Math.floor(data.height / 12)}' ${data.height % 12}"`
                      : "Select height (e.g. 5' 7\")"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Weight Input */}
            <View>
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Weight ({data.unit === "metric" ? "kg" : "lbs"})
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-2xl p-4 text-lg text-gray-700"
                placeholder={
                  data.unit === "metric"
                    ? "Enter weight in kg (e.g. 70)"
                    : "Enter weight in lbs (e.g. 154)"
                }
                placeholderTextColor="#9CA3AF"
                value={data.weight?.toString() || ""}
                onChangeText={(text) => {
                  const weight = parseFloat(text);
                  if (!isNaN(weight) && weight > 0) {
                    setData({ ...data, weight });
                  } else if (text === "") {
                    setData({ ...data, weight: undefined });
                  }
                }}
                keyboardType="numeric"
              />
            </View>

            {/* Height Picker Modal for Imperial */}
            <Modal visible={showHeightPicker} transparent animationType="slide">
              <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white rounded-3xl p-6 w-80 max-h-96">
                  <Text className="text-xl font-bold text-center mb-4">
                    Select Height
                  </Text>
                  <ScrollView className="max-h-64">
                    {Array.from({ length: 36 }, (_, i) => {
                      const feet = Math.floor((i + 48) / 12);
                      const inches = (i + 48) % 12;
                      const totalInches = i + 48;
                      return (
                        <TouchableOpacity
                          key={totalInches}
                          onPress={() => {
                            setData({ ...data, height: totalInches });
                            setShowHeightPicker(false);
                          }}
                          className={`py-3 px-4 rounded-xl mb-2 ${
                            data.height === totalInches
                              ? "bg-green-500"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-center font-medium ${
                              data.height === totalInches
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {feet}' {inches}"
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity
                    onPress={() => setShowHeightPicker(false)}
                    className="bg-gray-200 rounded-xl py-3 mt-4"
                  >
                    <Text className="text-center font-medium">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        );

      case 5: // Date of Birth
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              When were you born?
            </Text>
            <Text className="text-gray-600 mb-8">
              This helps calculate your metabolic rate
            </Text>

            <TextInput
              className="bg-white border border-gray-200 rounded-2xl p-4 text-lg text-gray-700"
              placeholder="Enter birth date (e.g. 13.06.2004)"
              placeholderTextColor="#9CA3AF"
              value={dateInputText}
              onChangeText={(text) => {
                setDateInputText(text);

                if (text === "") {
                  setData({ ...data, dateOfBirth: undefined });
                } else {
                  // Only try to parse if the text looks complete (has 2 dots)
                  const dotCount = (text.match(/\./g) || []).length;
                  if (dotCount === 2 && text.length >= 8) {
                    const parsedDate = parseDateString(text);
                    if (parsedDate) {
                      setData({ ...data, dateOfBirth: parsedDate });
                    }
                  }
                }
              }}
              keyboardType="default"
              maxLength={10} // DD.MM.YYYY = 10 characters
            />
          </View>
        );

      case 6: // Goal
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              What's your main goal?
            </Text>
            <Text className="text-gray-600 mb-8">
              We'll customize your plan accordingly
            </Text>

            <OptionButton
              icon={<AntDesign name="arrowdown" size={24} color="black" />}
              title="Lose weight"
              selected={data.goal === "lose"}
              onPress={() => setData({ ...data, goal: "lose" })}
            />
            <OptionButton
              icon={
                <FontAwesome name="balance-scale" size={24} color="black" />
              }
              title="Maintain weight"
              selected={data.goal === "maintain"}
              onPress={() => setData({ ...data, goal: "maintain" })}
            />
            <OptionButton
              icon={<AntDesign name="arrowup" size={24} color="black" />}
              title="Gain weight"
              selected={data.goal === "gain"}
              onPress={() => setData({ ...data, goal: "gain" })}
            />
            <OptionButton
              icon={<FontAwesome6 name="dumbbell" size={24} color="black" />}
              title="Build muscle"
              selected={data.goal === "muscle"}
              onPress={() => setData({ ...data, goal: "muscle" })}
            />
          </View>
        );

      case 7: // Diet
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Any dietary preferences?
            </Text>
            <Text className="text-gray-600 mb-8">
              This helps with food recommendations
            </Text>

            <OptionButton
              icon={<FontAwesome6 name="burger" size={24} color="black" />}
              title="No restrictions"
              selected={data.diet === "none"}
              onPress={() => setData({ ...data, diet: "none" })}
            />
            <OptionButton
              icon={
                <MaterialCommunityIcons
                  name="food-drumstick-off"
                  size={24}
                  color="black"
                />
              }
              title="Vegetarian"
              selected={data.diet === "vegetarian"}
              onPress={() => setData({ ...data, diet: "vegetarian" })}
            />
            <OptionButton
              icon={<FontAwesome6 name="leaf" size={24} color="black" />}
              title="Vegan"
              selected={data.diet === "vegan"}
              onPress={() => setData({ ...data, diet: "vegan" })}
            />
            <OptionButton
              icon={
                <MaterialCommunityIcons
                  name="food-drumstick"
                  size={24}
                  color="black"
                />
              }
              title="Keto"
              selected={data.diet === "keto"}
              onPress={() => setData({ ...data, diet: "keto" })}
            />
          </View>
        );

      case 8: // Final Summary
        // Calculate targets when we reach the final step
        if (
          currentStep === 8 &&
          !realTimeTargets &&
          !calculateTargetsMutation.isPending
        ) {
          calculateRealtimeTargets();
        }

        const recommendations =
          realTimeTargets || calculateFallbackRecommendations(data);
        return (
          <View className="flex-1 px-6 justify-center mt-24">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-black text-center mb-3">
                You're All Set
              </Text>
              <Text className="text-gray-600 text-center text-base leading-6">
                Based on your profile, here are your personalized daily targets
              </Text>
            </View>

            {/* Nutrition Cards */}
            <View className="mb-8">
              {/* Calories Card */}
              <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-600 text-sm font-medium">
                      Daily Calories
                    </Text>
                    {calculateTargetsMutation.isPending ? (
                      <Text className="text-2xl font-bold text-green-600 mt-1">
                        Calculating...
                      </Text>
                    ) : (
                      <Text className="text-2xl font-bold text-green-600 mt-1">
                        {recommendations.calories}
                      </Text>
                    )}
                  </View>
                  <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                    <FontAwesome6 name="fire" size={24} color="orange" />
                  </View>
                </View>
              </View>

              {/* Macros Grid */}
              <View className="flex-row gap-2">
                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <Text className="text-gray-600 text-xs font-medium mb-1">
                    PROTEIN
                  </Text>
                  <Text className="text-xl font-bold text-blue-500">
                    {Math.round(
                      recommendations.protein_g || recommendations.protein || 0
                    )}
                    g
                  </Text>
                </View>

                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <Text className="text-gray-600 text-xs font-medium mb-1">
                    CARBS
                  </Text>
                  <Text className="text-xl font-bold text-orange-500">
                    {Math.round(
                      recommendations.carbs_g || recommendations.carbs || 0
                    )}
                    g
                  </Text>
                </View>

                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <Text className="text-gray-600 text-xs font-medium mb-1">
                    FATS
                  </Text>
                  <Text className="text-xl font-bold text-purple-500">
                    {Math.round(
                      recommendations.fats_g || recommendations.fats || 0
                    )}
                    g
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Text */}
            <View className="bg-gray-50 rounded-2xl p-6">
              <Text className="text-center text-gray-700 text-base leading-6">
                These targets are personalized for your goals. You can always
                adjust them later in your profile settings.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={["#ffffff", "#f8fafc"]} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Progress Bar */}
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-gray-500">
              Step {currentStep + 1} of {totalSteps}
            </Text>
            <Text className="text-sm text-gray-500">
              {Math.round(progress)}%
            </Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full">
            <View
              className="h-2 bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View className="flex-row justify-between items-center px-6 py-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleBack}
            className={`flex-row items-center px-4 py-2 rounded-xl ${currentStep === 0 ? "opacity-50" : ""}`}
            disabled={currentStep === 0}
          >
            <IconSymbol name="chevron.left" size={20} color="#6B7280" />
            <Text className="text-gray-600 ml-1">Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            className={`px-8 py-3 rounded-xl ${canProceed ? "bg-green-500" : "bg-gray-300"}`}
            disabled={!canProceed}
          >
            <Text
              className={`font-semibold ${canProceed ? "text-white" : "text-gray-500"}`}
            >
              {currentStep === totalSteps - 1 ? "Let's Get Started!" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

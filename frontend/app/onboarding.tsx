"use client";

import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  const totalSteps = 9;
  const progress = ((currentStep + 1) / totalSteps) * 100;

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
      // Save onboarding data to AsyncStorage
      await AsyncStorage.setItem("onboardingData", JSON.stringify(data));
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");

      // Here you would also send data to your backend
      console.log("Onboarding data:", data);

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const calculateRecommendations = (userData: OnboardingData) => {
    let baseCalories = 2000;
    const protein = 150;
    const carbs = 250;
    const fats = 65;

    // Adjust based on user data
    if (userData.gender === "male") baseCalories += 200;
    if (userData.activityLevel === "high") baseCalories += 300;
    if (userData.goal === "lose") baseCalories -= 300;
    if (userData.goal === "gain") baseCalories += 300;

    return { calories: baseCalories, protein, carbs, fats };
  };

  const OptionButton = ({
    icon,
    title,
    selected,
    onPress,
  }: {
    icon: string;
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
              icon="👨"
              title="Male"
              selected={data.gender === "male"}
              onPress={() => setData({ ...data, gender: "male" })}
            />
            <OptionButton
              icon="👩"
              title="Female"
              selected={data.gender === "female"}
              onPress={() => setData({ ...data, gender: "female" })}
            />
            <OptionButton
              icon="⚧️"
              title="Other"
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
              icon="🛋️"
              title="Sedentary (Little to no exercise)"
              selected={data.activityLevel === "low"}
              onPress={() => setData({ ...data, activityLevel: "low" })}
            />
            <OptionButton
              icon="🚶"
              title="Lightly Active (Light exercise 1-3 days/week)"
              selected={data.activityLevel === "moderate"}
              onPress={() => setData({ ...data, activityLevel: "moderate" })}
            />
            <OptionButton
              icon="🏃"
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
              icon="😅"
              title="Yes, it's been challenging"
              selected={data.trackingDifficulty === "yes"}
              onPress={() => setData({ ...data, trackingDifficulty: "yes" })}
            />
            <OptionButton
              icon="😐"
              title="Sometimes, but manageable"
              selected={data.trackingDifficulty === "sometimes"}
              onPress={() =>
                setData({ ...data, trackingDifficulty: "sometimes" })
              }
            />
            <OptionButton
              icon="😊"
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
              icon="🌱"
              title="Complete beginner"
              selected={data.experience === "beginner"}
              onPress={() => setData({ ...data, experience: "beginner" })}
            />
            <OptionButton
              icon="📚"
              title="Some experience"
              selected={data.experience === "intermediate"}
              onPress={() => setData({ ...data, experience: "intermediate" })}
            />
            <OptionButton
              icon="🏆"
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
                onPress={() => setData({ ...data, unit: "metric" })}
                className={`flex-1 py-3 rounded-xl ${data.unit === "metric" ? "bg-white shadow-sm" : ""}`}
              >
                <Text
                  className={`text-center font-medium ${data.unit === "metric" ? "text-gray-900" : "text-gray-500"}`}
                >
                  Metric
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setData({ ...data, unit: "imperial" })}
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
              <TouchableOpacity
                onPress={() => setData({ ...data, height: 175 })}
                className="bg-white border border-gray-200 rounded-2xl p-4"
              >
                <Text className="text-lg text-gray-700">
                  {data.height
                    ? `${data.height} ${data.unit === "metric" ? "cm" : "ft"}`
                    : "Select height"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Weight Input */}
            <View>
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Weight ({data.unit === "metric" ? "kg" : "lbs"})
              </Text>
              <TouchableOpacity
                onPress={() => setData({ ...data, weight: 70 })}
                className="bg-white border border-gray-200 rounded-2xl p-4"
              >
                <Text className="text-lg text-gray-700">
                  {data.weight
                    ? `${data.weight} ${data.unit === "metric" ? "kg" : "lbs"}`
                    : "Select weight"}
                </Text>
              </TouchableOpacity>
            </View>
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

            <TouchableOpacity
              onPress={() =>
                setData({ ...data, dateOfBirth: new Date(1995, 0, 1) })
              }
              className="bg-white border border-gray-200 rounded-2xl p-4"
            >
              <Text className="text-lg text-gray-700">
                {data.dateOfBirth
                  ? data.dateOfBirth.toDateString()
                  : "Select your birth date"}
              </Text>
            </TouchableOpacity>
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
              icon="⬇️"
              title="Lose weight"
              selected={data.goal === "lose"}
              onPress={() => setData({ ...data, goal: "lose" })}
            />
            <OptionButton
              icon="⚖️"
              title="Maintain weight"
              selected={data.goal === "maintain"}
              onPress={() => setData({ ...data, goal: "maintain" })}
            />
            <OptionButton
              icon="⬆️"
              title="Gain weight"
              selected={data.goal === "gain"}
              onPress={() => setData({ ...data, goal: "gain" })}
            />
            <OptionButton
              icon="💪"
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
              icon="🍖"
              title="No restrictions"
              selected={data.diet === "none"}
              onPress={() => setData({ ...data, diet: "none" })}
            />
            <OptionButton
              icon="🥗"
              title="Vegetarian"
              selected={data.diet === "vegetarian"}
              onPress={() => setData({ ...data, diet: "vegetarian" })}
            />
            <OptionButton
              icon="🌱"
              title="Vegan"
              selected={data.diet === "vegan"}
              onPress={() => setData({ ...data, diet: "vegan" })}
            />
            <OptionButton
              icon="🥩"
              title="Keto"
              selected={data.diet === "keto"}
              onPress={() => setData({ ...data, diet: "keto" })}
            />
          </View>
        );

      case 8: // Final Summary
        const recommendations = calculateRecommendations(data);
        return (
          <View className="flex-1 px-6 justify-center">
            <View className="bg-green-50 rounded-3xl p-8 mb-8">
              <Text className="text-2xl font-bold text-green-800 text-center mb-4">
                🎉 Your Plan is Ready!
              </Text>

              <Text className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Daily Recommendations
              </Text>

              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700">Calories</Text>
                  <Text className="font-bold text-green-600">
                    {recommendations.calories}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700">Protein</Text>
                  <Text className="font-bold text-blue-600">
                    {recommendations.protein}g
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700">Carbs</Text>
                  <Text className="font-bold text-orange-600">
                    {recommendations.carbs}g
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700">Fats</Text>
                  <Text className="font-bold text-purple-600">
                    {recommendations.fats}g
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-center text-gray-600 mb-8">
              Your personalized nutrition plan is ready! Start tracking your
              meals and reach your goals.
            </Text>
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

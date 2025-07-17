"use client";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Activity,
  Zap,
  Battery,
  BatteryLow,
  Frown,
  Meh,
  Smile,
  Leaf,
  BookOpen,
  Award,
  Ruler,
  Weight,
  Calendar,
  Target,
  TrendingDown,
  TrendingUp,
  Dumbbell,
  Utensils,
  Apple,
  Carrot,
  Wheat,
  Flame,
  CheckCircle,
} from "lucide-react-native";
import { router } from "expo-router";
import type React from "react";
import {
  useCreateProfile,
  type OnboardingData as OnboardingDataType,
} from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

// Import selector components
import HeightSelectorOnboarding from "./(tabs)/height-selector-onboarding";
import WeightSelectorOnboarding from "./(tabs)/weight-selector-onboarding";
import DateSelectorOnboarding from "./(tabs)/date-selector-onboarding";

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
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({ unit: "metric" });
  const [canProceed, setCanProceed] = useState(false);
  const [realTimeTargets, setRealTimeTargets] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSelectorActive, setIsSelectorActive] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  // API hooks
  const createProfileMutation = useCreateProfile();
  const { setOnboardingCompleted } = useAuth();

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

  // Disable main scroll when selectors are active
  useEffect(() => {
    setIsSelectorActive(currentStep === 4);
  }, [currentStep]);

  // Step transition animation
  const animateStepTransition = () => {
    // Reset animations to initial state
    fadeAnim.setValue(1);
    slideAnim.setValue(0);

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      animateStepTransition();
      // Delay step change to prevent jitter
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 100);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateStepTransition();
      // Delay step change to prevent jitter
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
      }, 100);
    }
  };

  const handleComplete = async () => {
    try {
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

      const result = await createProfileMutation.mutateAsync(profileData);
      setRealTimeTargets(result.daily_targets);

      // Profile is now persisted in backend, just update local state
      await setOnboardingCompleted(true);

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error creating profile:", error);
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
              // Just update local state since backend persistence is handled by profile creation
              await setOnboardingCompleted(true);
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

    setIsCalculating(true);

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

      const result = await createProfileMutation.mutateAsync(profileData);
      setRealTimeTargets(result.daily_targets);
    } catch (error) {
      console.error("Error calculating targets:", error);
      setRealTimeTargets(calculateFallbackRecommendations(data));
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateFallbackRecommendations = (userData: OnboardingData) => {
    let baseCalories = 2000;
    const protein = 150;
    const carbs = 250;
    const fats = 65;

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
      let newHeight = data.height;
      let newWeight = data.weight;

      if (data.unit === "metric" && newUnit === "imperial") {
        if (data.height) newHeight = Math.round(data.height / 2.54);
        if (data.weight) newWeight = Math.round(data.weight * 2.205);
      } else if (data.unit === "imperial" && newUnit === "metric") {
        if (data.height) newHeight = Math.round(data.height * 2.54);
        if (data.weight) newWeight = Math.round(data.weight / 2.205);
      }

      setData({ ...data, unit: newUnit, height: newHeight, weight: newWeight });
    } catch (error) {
      console.error("Error in handleUnitChange:", error);
    }
  };

  const OptionButton = ({
    icon,
    title,
    subtitle,
    selected,
    onPress,
    twoLines = false,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    selected: boolean;
    onPress: () => void;
    twoLines?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center p-4 rounded-2xl mb-3 border-2 ${
        selected ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
      } ${twoLines ? "min-h-[72px]" : ""}`}
    >
      <View className="mr-4">{icon}</View>
      <View className="flex-1">
        <Text
          className={`text-lg font-medium ${selected ? "text-green-700" : "text-gray-700"}`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            className={`text-sm ${selected ? "text-green-600" : "text-gray-500"}`}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {selected && (
        <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
          <CheckCircle size={16} color="white" />
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
              {t("onboarding.gender.title")}
            </Text>
            <Text className="text-gray-600 mb-2">
              {t("onboarding.gender.subtitle")}
            </Text>
            <Text className="text-sm text-gray-500 mb-8 leading-5">
              {t("onboarding.gender.description")}
            </Text>

            <OptionButton
              icon={<User size={24} color="#374151" />}
              title={t("onboarding.gender.male")}
              selected={data.gender === "male"}
              onPress={() => setData({ ...data, gender: "male" })}
            />
            <OptionButton
              icon={<Users size={24} color="#374151" />}
              title={t("onboarding.gender.female")}
              selected={data.gender === "female"}
              onPress={() => setData({ ...data, gender: "female" })}
            />
            <OptionButton
              icon={<User size={24} color="#374151" />}
              title={t("onboarding.gender.preferNotToSay")}
              selected={data.gender === "other"}
              onPress={() => setData({ ...data, gender: "other" })}
            />
          </View>
        );

      case 1: // Activity Level
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {t("onboarding.activity.title")}
            </Text>
            <Text className="text-gray-600 mb-2">
              {t("onboarding.activity.subtitle")}
            </Text>
            <Text className="text-sm text-gray-500 mb-8 leading-5">
              {t("onboarding.activity.description")}
            </Text>

            <OptionButton
              icon={<Battery size={24} color="#374151" />}
              title="Sedentary"
              subtitle="Little to no exercise"
              selected={data.activityLevel === "low"}
              onPress={() => setData({ ...data, activityLevel: "low" })}
              twoLines={true}
            />
            <OptionButton
              icon={<BatteryLow size={24} color="#374151" />}
              title="Lightly Active"
              subtitle="Light exercise 1-3 days/week"
              selected={data.activityLevel === "moderate"}
              onPress={() => setData({ ...data, activityLevel: "moderate" })}
              twoLines={true}
            />
            <OptionButton
              icon={<Zap size={24} color="#374151" />}
              title="Very Active"
              subtitle="Hard exercise 6-7 days/week"
              selected={data.activityLevel === "high"}
              onPress={() => setData({ ...data, activityLevel: "high" })}
              twoLines={true}
            />
          </View>
        );

      case 2: // Tracking Difficulty
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Have you had difficulty tracking calories?
            </Text>
            <Text className="text-gray-600 mb-2">
              We'll customize your experience accordingly
            </Text>
            <Text className="text-sm text-gray-500 mb-8 leading-5">
              We'll customize the app based on your experience.
            </Text>

            <OptionButton
              icon={<Frown size={24} color="#374151" />}
              title="Yes, it's been challenging"
              selected={data.trackingDifficulty === "yes"}
              onPress={() => setData({ ...data, trackingDifficulty: "yes" })}
            />
            <OptionButton
              icon={<Meh size={24} color="#374151" />}
              title="Sometimes, but manageable"
              selected={data.trackingDifficulty === "sometimes"}
              onPress={() =>
                setData({ ...data, trackingDifficulty: "sometimes" })
              }
            />
            <OptionButton
              icon={<Smile size={24} color="#374151" />}
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
            <Text className="text-gray-600 mb-2">
              This helps us tailor the app for you
            </Text>
            <Text className="text-sm text-gray-500 mb-8 leading-5">
              Your experience level helps us show appropriate guidance.
            </Text>

            <OptionButton
              icon={<Leaf size={24} color="#374151" />}
              title="Complete beginner"
              selected={data.experience === "beginner"}
              onPress={() => setData({ ...data, experience: "beginner" })}
            />
            <OptionButton
              icon={<BookOpen size={24} color="#374151" />}
              title="Some experience"
              selected={data.experience === "intermediate"}
              onPress={() => setData({ ...data, experience: "intermediate" })}
            />
            <OptionButton
              icon={<Award size={24} color="#374151" />}
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
            <Text className="text-gray-600 mb-2">
              We need this to calculate your daily needs
            </Text>
            <Text className="text-sm text-gray-500 mb-6 leading-5">
              Height and weight are needed for accurate daily targets.
            </Text>
            {/* Height Selector */}
            <View className="mb-6">
              <View className="flex-row gap-2">
                <Ruler size={20} color="#374151" className="mr-2" />
                <Text className="text-lg font-semibold text-gray-900 mb-2 flex-row items-center">
                  Height (cm)
                </Text>
              </View>
              <HeightSelectorOnboarding
                currentValue={data.height}
                onValueChange={(height) => {
                  console.log("Height changed to:", height);
                  setData({ ...data, height });
                }}
              />
            </View>
            {/* Weight Selector */}
            <View className="mb-4">
              <View className="flex-row gap-2">
                <Weight size={20} color="#374151" className="mr-2" />
                <Text className="text-lg font-semibold text-gray-900 mb-2 flex-row items-center">
                  Weight (kg)
                </Text>
              </View>
              <WeightSelectorOnboarding
                currentValue={data.weight}
                onValueChange={(weight) => {
                  console.log("Weight changed to:", weight);
                  setData({ ...data, weight });
                }}
              />
            </View>
            {/* Debug info
            <View className="mt-4 p-3 bg-gray-100 rounded-lg">
              <Text className="text-xs text-gray-600">
                Debug: Height={data.height}, Weight={data.weight}, CanProceed=
                {canProceed.toString()}
              </Text>
            </View> */}
          </View>
        );

      case 5: // Date of Birth
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              When were you born?
            </Text>
            <Text className="text-gray-600 mb-2">
              This helps calculate your metabolic rate
            </Text>
            <Text className="text-sm text-gray-500 mb-6 leading-5">
              Age affects your metabolic rate and calorie needs.
            </Text>

            <View className="flex-row gap-2">
              <Calendar size={20} color="#374151" className="mr-2" />
              <Text className="text-lg font-semibold text-gray-900 mb-3 flex-row items-center">
                Date of Birth
              </Text>
            </View>
            <DateSelectorOnboarding
              currentDate={data.dateOfBirth}
              onDateChange={(date) => setData({ ...data, dateOfBirth: date })}
            />
          </View>
        );

      case 6: // Goal
        return (
          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              What's your main goal?
            </Text>
            <Text className="text-gray-600 mb-2">
              We'll customize your plan accordingly
            </Text>
            <Text className="text-sm text-gray-500 mb-8 leading-5">
              Your goal determines your personalized calorie targets.
            </Text>

            <OptionButton
              icon={<TrendingDown size={24} color="#374151" />}
              title="Lose weight"
              selected={data.goal === "lose"}
              onPress={() => setData({ ...data, goal: "lose" })}
            />
            <OptionButton
              icon={<Target size={24} color="#374151" />}
              title="Maintain weight"
              selected={data.goal === "maintain"}
              onPress={() => setData({ ...data, goal: "maintain" })}
            />
            <OptionButton
              icon={<TrendingUp size={24} color="#374151" />}
              title="Gain weight"
              selected={data.goal === "gain"}
              onPress={() => setData({ ...data, goal: "gain" })}
            />
            <OptionButton
              icon={<Dumbbell size={24} color="#374151" />}
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
            <Text className="text-gray-600 mb-2">
              This helps with food recommendations
            </Text>
            <Text className="text-sm text-gray-500 mb-8 leading-5">
              Dietary preferences help with food recommendations.
            </Text>

            <OptionButton
              icon={<Utensils size={24} color="#374151" />}
              title="No restrictions"
              selected={data.diet === "none"}
              onPress={() => setData({ ...data, diet: "none" })}
            />
            <OptionButton
              icon={<Apple size={24} color="#374151" />}
              title="Vegetarian"
              selected={data.diet === "vegetarian"}
              onPress={() => setData({ ...data, diet: "vegetarian" })}
            />
            <OptionButton
              icon={<Carrot size={24} color="#374151" />}
              title="Vegan"
              selected={data.diet === "vegan"}
              onPress={() => setData({ ...data, diet: "vegan" })}
            />
            <OptionButton
              icon={<Wheat size={24} color="#374151" />}
              title="Keto"
              selected={data.diet === "keto"}
              onPress={() => setData({ ...data, diet: "keto" })}
            />
          </View>
        );

      case 8: // Final Summary
        // Calculate targets when we reach the final step
        if (currentStep === 8 && !realTimeTargets && !isCalculating) {
          calculateRealtimeTargets();
        }

        return (
          <View
            className="flex-1 px-6 justify-center"
            style={{ paddingTop: 100 }}
          >
            {/* Header */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-black text-center mb-3">
                You're All Set! 🎉
              </Text>
              <Text className="text-gray-600 text-center text-base leading-6">
                {isCalculating
                  ? "Calculating your personalized daily targets..."
                  : "Based on your profile, here are your personalized daily targets"}
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
                    {isCalculating ? (
                      <View className="flex-row items-center mt-1">
                        <Text className="text-2xl font-bold text-gray-400">
                          ---
                        </Text>
                        <View className="ml-2">
                          <Activity size={20} color="#9CA3AF" />
                        </View>
                      </View>
                    ) : (
                      <Text className="text-2xl font-bold text-green-600 mt-1">
                        {realTimeTargets?.calories || "---"}
                      </Text>
                    )}
                  </View>
                  <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
                    <Flame size={24} color="green" />
                  </View>
                </View>
              </View>

              {/* Macros Grid */}
              <View className="flex-row gap-2">
                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <Text className="text-gray-600 text-xs font-medium mb-1">
                    PROTEIN
                  </Text>
                  <Text className="text-xl font-bold text-rose-600">
                    {isCalculating
                      ? "---"
                      : `${Math.round(realTimeTargets?.protein_g || realTimeTargets?.protein || 0)}g`}
                  </Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <Text className="text-gray-600 text-xs font-medium mb-1">
                    FATS
                  </Text>
                  <Text className="text-xl font-bold text-sky-600">
                    {isCalculating
                      ? "---"
                      : `${Math.round(realTimeTargets?.fats_g || realTimeTargets?.fats || 0)}g`}
                  </Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <Text className="text-gray-600 text-xs font-medium mb-1">
                    CARBS
                  </Text>
                  <Text className="text-xl font-bold text-orange-500">
                    {isCalculating
                      ? "---"
                      : `${Math.round(realTimeTargets?.carbs_g || realTimeTargets?.carbs || 0)}g`}
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
            <Animated.View
              className="h-2 bg-green-500 rounded-full"
              style={{
                width: `${progress}%`,
              }}
            />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {renderStep()}
          </Animated.View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View className="flex-row justify-between items-center px-6 py-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleBack}
            className={`flex-row items-center px-4 py-2 rounded-xl ${currentStep === 0 ? "opacity-50" : ""}`}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={20} color="#6B7280" />
            <Text className="text-gray-600 ml-1">Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            className={`px-8 py-3 rounded-xl flex-row items-center ${canProceed ? "bg-green-500" : "bg-gray-300"}`}
            disabled={!canProceed}
          >
            <Text
              className={`font-semibold mr-2 ${canProceed ? "text-white" : "text-gray-500"}`}
            >
              {currentStep === totalSteps - 1 ? "Let's Get Started!" : "Next"}
            </Text>
            {currentStep !== totalSteps - 1 && (
              <ChevronRight
                size={16}
                color={canProceed ? "white" : "#6B7280"}
              />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

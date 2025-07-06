"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile, useRecalculateTargets } from "@/hooks/useUserProfile";
import { useRouter } from "expo-router";
import { useSelectorContext } from "@/contexts/SelectorContext";
import { useMutateNutrition } from "@/hooks/useMutateNutrition";

const EditProfileScreen = () => {
  const router = useRouter();
  const { session } = useAuth();
  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile();
  const recalculateTargetsMutation = useRecalculateTargets();
  const { invalidateAllNutrition } = useMutateNutrition();

  const [isLoading, setIsLoading] = useState(false);
  const [showRecalculationModal, setShowRecalculationModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isNavigatingToHeight, setIsNavigatingToHeight] = useState(false);
  const [isNavigatingToWeight, setIsNavigatingToWeight] = useState(false);
  const [isNavigatingToDate, setIsNavigatingToDate] = useState(false);
  const [profileData, setProfileData] = useState({
    gender: "",
    activity_level: "",
    tracking_difficulty: "",
    experience_level: "",
    height_unit: "metric",
    height_value: 170,
    weight_unit: "metric",
    weight_value: 70,
    date_of_birth: "",
    main_goal: "",
    dietary_preference: "",
  });

  const [dropdownAnimations, setDropdownAnimations] = useState<{
    [key: string]: Animated.Value;
  }>({});

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        gender: userProfile.profile.gender || "",
        activity_level: userProfile.profile.activity_level || "",
        tracking_difficulty: userProfile.profile.tracking_difficulty || "",
        experience_level: userProfile.profile.experience_level || "",
        height_unit: userProfile.profile.height_unit || "metric",
        height_value: userProfile.profile.height_value || 170,
        weight_unit: userProfile.profile.weight_unit || "metric",
        weight_value: userProfile.profile.weight_value || 70,
        date_of_birth: userProfile.profile.date_of_birth || "",
        main_goal: userProfile.profile.main_goal || "",
        dietary_preference: userProfile.profile.dietary_preference || "",
      });
    }
  }, [userProfile]);

  // Get selector data from context
  const { selectorData, clearSelectorData } = useSelectorContext();

  // Check for updates from selectors when context data changes
  useEffect(() => {
    // Check for height updates
    if (selectorData.selectedHeight && selectorData.heightUnit) {
      setProfileData((prev) => ({
        ...prev,
        height_value: selectorData.selectedHeight!,
        height_unit: selectorData.heightUnit!,
      }));
      // Clear the data after using it
      clearSelectorData();
    }

    // Check for weight updates
    if (selectorData.selectedWeight && selectorData.weightUnit) {
      setProfileData((prev) => ({
        ...prev,
        weight_value: selectorData.selectedWeight!,
        weight_unit: selectorData.weightUnit!,
      }));
      // Clear the data after using it
      clearSelectorData();
    }

    // Check for date updates
    if (selectorData.selectedDate) {
      setProfileData((prev) => ({
        ...prev,
        date_of_birth: selectorData.selectedDate!,
      }));
      // Clear the data after using it
      clearSelectorData();
    }
  }, [selectorData, clearSelectorData]);

  const formatGender = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      male: "Male",
      female: "Female",
      other: "Prefer not to say",
    };
    return genderMap[gender] || gender;
  };

  const formatActivityLevel = (level: string) => {
    const activityMap: { [key: string]: string } = {
      low: "Sedentary",
      moderate: "Lightly Active",
      high: "Very Active",
      // Backend values
      sedentary: "Sedentary",
      lightly_active: "Lightly Active",
      very_active: "Very Active",
    };
    return activityMap[level] || level;
  };

  const formatGoal = (goal: string) => {
    const goalMap: { [key: string]: string } = {
      lose: "Lose weight",
      maintain: "Maintain weight",
      gain: "Gain weight",
      muscle: "Build muscle",
      // Backend values
      lose_weight: "Lose weight",
      maintain_weight: "Maintain weight",
      gain_weight: "Gain weight",
      build_muscle: "Build muscle",
    };
    return goalMap[goal] || goal;
  };

  const formatDietaryPreference = (preference: string) => {
    const dietMap: { [key: string]: string } = {
      none: "No restrictions",
      vegetarian: "Vegetarian",
      vegan: "Vegan",
      keto: "Keto",
      // Backend values
      no_restrictions: "No restrictions",
    };
    return dietMap[preference] || preference;
  };

  const formatTrackingDifficulty = (difficulty: string) => {
    const difficultyMap: { [key: string]: string } = {
      yes: "Challenging",
      sometimes: "Sometimes",
      no: "Easy",
      // Backend values
      challenging: "Challenging",
      manageable: "Sometimes",
      easy: "Easy",
    };
    return difficultyMap[difficulty] || difficulty;
  };

  const formatExperienceLevel = (level: string) => {
    const experienceMap: { [key: string]: string } = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      expert: "Advanced",
      // Backend values
      some_experience: "Intermediate",
      very_experienced: "Advanced",
    };
    return experienceMap[level] || level;
  };

  const handleHeightPress = useCallback(() => {
    if (isNavigatingToHeight) return; // Prevent multiple rapid clicks

    setIsNavigatingToHeight(true);

    // Add a small delay to prevent rapid navigation
    setTimeout(() => {
      router.push({
        pathname: "/height-selector",
        params: {
          currentValue: profileData.height_value.toString(),
          unit: profileData.height_unit,
        },
      });
      // Reset the flag after navigation
      setTimeout(() => setIsNavigatingToHeight(false), 500);
    }, 100);
  }, [isNavigatingToHeight, profileData.height_value, profileData.height_unit]);

  const handleWeightPress = useCallback(() => {
    if (isNavigatingToWeight) return; // Prevent multiple rapid clicks

    setIsNavigatingToWeight(true);

    // Add a small delay to prevent rapid navigation
    setTimeout(() => {
      router.push({
        pathname: "/weight-selector",
        params: {
          currentValue: profileData.weight_value.toString(),
          unit: profileData.weight_unit,
        },
      });
      // Reset the flag after navigation
      setTimeout(() => setIsNavigatingToWeight(false), 500);
    }, 100);
  }, [isNavigatingToWeight, profileData.weight_value, profileData.weight_unit]);

  const handleDateOfBirthPress = useCallback(() => {
    if (isNavigatingToDate) return; // Prevent multiple rapid clicks

    setIsNavigatingToDate(true);

    // Add a small delay to prevent rapid navigation
    setTimeout(() => {
      router.push({
        pathname: "/date-selector",
        params: {
          currentDate: profileData.date_of_birth,
        },
      });
      // Reset the flag after navigation
      setTimeout(() => setIsNavigatingToDate(false), 500);
    }, 100);
  }, [isNavigatingToDate, profileData.date_of_birth]);

  // Map frontend values to backend values
  const mapToBackendValues = (data: any) => {
    console.log("Mapping function called with data:", data);

    const activityLevelMap: { [key: string]: string } = {
      low: "sedentary",
      moderate: "lightly_active",
      high: "very_active",
      // Also handle backend values that might already be correct
      sedentary: "sedentary",
      lightly_active: "lightly_active",
      very_active: "very_active",
    };

    const goalMap: { [key: string]: string } = {
      lose: "lose_weight",
      maintain: "maintain_weight",
      gain: "gain_weight",
      muscle: "build_muscle",
      // Also handle backend values
      lose_weight: "lose_weight",
      maintain_weight: "maintain_weight",
      gain_weight: "gain_weight",
      build_muscle: "build_muscle",
    };

    const dietMap: { [key: string]: string } = {
      none: "no_restrictions",
      vegetarian: "vegetarian",
      vegan: "vegan",
      keto: "keto",
      // Also handle backend values
      no_restrictions: "no_restrictions",
    };

    const trackingDifficultyMap: { [key: string]: string } = {
      yes: "challenging",
      sometimes: "manageable",
      no: "easy",
      // Also handle backend values
      challenging: "challenging",
      manageable: "manageable",
      easy: "easy",
    };

    const experienceMap: { [key: string]: string } = {
      beginner: "beginner",
      intermediate: "some_experience",
      expert: "very_experienced",
      // Also handle backend values
      some_experience: "some_experience",
      very_experienced: "very_experienced",
    };

    const mappedData = {
      ...data,
      activity_level:
        activityLevelMap[data.activity_level] || data.activity_level,
      main_goal: goalMap[data.main_goal] || data.main_goal,
      dietary_preference:
        dietMap[data.dietary_preference] || data.dietary_preference,
      tracking_difficulty:
        trackingDifficultyMap[data.tracking_difficulty] ||
        data.tracking_difficulty,
      experience_level:
        experienceMap[data.experience_level] || data.experience_level,
    };

    console.log("Mapped data result:", mappedData);
    return mappedData;
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Map frontend values to backend values
      const mappedData = mapToBackendValues(profileData);
      console.log("Original profile data:", profileData);
      console.log("Mapped profile data:", mappedData);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_PRODUCTION_API_URL}/user_profiles`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mappedData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Profile update failed:", response.status, errorText);
        throw new Error(
          `Failed to update profile: ${response.status} ${errorText}`
        );
      }

      // Show recalculation modal instead of immediately navigating back
      setShowRecalculationModal(true);
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculateTargets = async () => {
    try {
      await recalculateTargetsMutation.mutateAsync();
      setShowRecalculationModal(false);

      // Invalidate all nutrition data to ensure fresh data
      invalidateAllNutrition();

      router.back();
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to recalculate targets. Please try again.");
    }
  };

  const handleSkipRecalculation = () => {
    setShowRecalculationModal(false);
    router.push("/(tabs)");
  };

  const DropdownOption = ({
    title,
    value,
    onPress,
  }: {
    title: string;
    value: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="py-3 px-4 border-b border-gray-100 last:border-b-0"
    >
      <Text className="text-gray-900 font-medium text-right">{title}</Text>
    </TouchableOpacity>
  );

  const SettingRowWithDropdown = ({
    title,
    value,
    unit = "",
    onPress,
    dropdownKey,
    dropdownOptions,
    showArrow = true,
  }: {
    title: string;
    value?: string | number;
    unit?: string;
    onPress?: () => void;
    dropdownKey?: string;
    dropdownOptions?: Array<{ title: string; value: string }>;
    showArrow?: boolean;
  }) => {
    // Initialize animation value for this dropdown if it doesn't exist
    useEffect(() => {
      if (dropdownKey && !dropdownAnimations[dropdownKey]) {
        setDropdownAnimations((prev) => ({
          ...prev,
          [dropdownKey]: new Animated.Value(0),
        }));
      }
    }, [dropdownKey]); // Remove dropdownAnimations from dependency to avoid infinite loops

    // Calculate dropdown width based on content with better positioning
    const getDropdownWidth = () => {
      if (!dropdownOptions) return 150;
      const maxLength = Math.max(
        ...dropdownOptions.map((option) => option.title.length)
      );
      return Math.min(Math.max(maxLength * 8 + 24, 100), 180); // Reduced padding and max width
    };

    const handleDropdownToggle = () => {
      if (dropdownKey) {
        const isCurrentlyOpen = openDropdown === dropdownKey;
        const newDropdown = isCurrentlyOpen ? null : dropdownKey;

        if (isCurrentlyOpen) {
          // Animate close
          Animated.timing(dropdownAnimations[dropdownKey], {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            setOpenDropdown(null);
          });
        } else {
          // Open dropdown first, then animate
          setOpenDropdown(newDropdown);

          // Animate open
          Animated.timing(dropdownAnimations[dropdownKey], {
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          }).start();
        }
      } else if (onPress) {
        onPress();
      }
    };

    return (
      <View className="relative">
        <TouchableOpacity
          onPress={handleDropdownToggle}
          className="flex-row items-center justify-between py-4 px-6 border-b border-gray-100"
        >
          <Text className="text-gray-900 font-medium text-base">{title}</Text>
          <View className="flex-row items-center">
            {value && (
              <Text className="text-gray-600 mr-2">
                {value} {unit}
              </Text>
            )}
            {showArrow && (
              <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
            )}
          </View>
        </TouchableOpacity>

        {/* Animated Dropdown Menu */}
        {dropdownKey &&
          openDropdown === dropdownKey &&
          dropdownOptions &&
          dropdownAnimations[dropdownKey] && (
            <Animated.View
              className="absolute top-full bg-white rounded-2xl shadow-lg border border-gray-200 z-50"
              style={{
                right: 16, // Moved more to the right for better alignment
                width: getDropdownWidth(),
                opacity: dropdownAnimations[dropdownKey],
                transform: [
                  {
                    translateY: dropdownAnimations[dropdownKey].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0], // Slide down effect
                    }),
                  },
                  {
                    scaleY: dropdownAnimations[dropdownKey].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1], // Scale up effect
                    }),
                  },
                ],
              }}
            >
              {dropdownOptions.map((option, index) => (
                <DropdownOption
                  key={index}
                  title={option.title}
                  value={option.value}
                  onPress={() => {
                    // Animate close first, then update state
                    Animated.timing(dropdownAnimations[dropdownKey], {
                      toValue: 0,
                      duration: 150,
                      useNativeDriver: false,
                    }).start(() => {
                      if (dropdownKey === "gender") {
                        setProfileData({
                          ...profileData,
                          gender: option.value,
                        });
                      } else if (dropdownKey === "activity") {
                        setProfileData({
                          ...profileData,
                          activity_level: option.value,
                        });
                      } else if (dropdownKey === "goal") {
                        setProfileData({
                          ...profileData,
                          main_goal: option.value,
                        });
                      } else if (dropdownKey === "diet") {
                        setProfileData({
                          ...profileData,
                          dietary_preference: option.value,
                        });
                      } else if (dropdownKey === "tracking") {
                        setProfileData({
                          ...profileData,
                          tracking_difficulty: option.value,
                        });
                      } else if (dropdownKey === "experience") {
                        setProfileData({
                          ...profileData,
                          experience_level: option.value,
                        });
                      }
                      setOpenDropdown(null);
                    });
                  }}
                />
              ))}
            </Animated.View>
          )}
      </View>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-lg font-semibold text-gray-900 px-6 pt-8 pb-4">
      {title}
    </Text>
  );

  if (isLoadingProfile) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4">Loading profile...</Text>
      </View>
    );
  }

  const genderOptions = [
    { title: "Male", value: "male" },
    { title: "Female", value: "female" },
    { title: "Prefer not to say", value: "other" },
  ];

  const activityOptions = [
    { title: "Sedentary", value: "low" },
    { title: "Lightly Active", value: "moderate" },
    { title: "Very Active", value: "high" },
  ];

  const goalOptions = [
    { title: "Lose weight", value: "lose" },
    { title: "Maintain weight", value: "maintain" },
    { title: "Gain weight", value: "gain" },
    { title: "Build muscle", value: "muscle" },
  ];

  const dietOptions = [
    { title: "No restrictions", value: "none" },
    { title: "Vegetarian", value: "vegetarian" },
    { title: "Vegan", value: "vegan" },
    { title: "Keto", value: "keto" },
  ];

  const trackingOptions = [
    { title: "Challenging", value: "yes" },
    { title: "Sometimes", value: "sometimes" },
    { title: "Easy", value: "no" },
  ];

  const experienceOptions = [
    { title: "Beginner", value: "beginner" },
    { title: "Intermediate", value: "intermediate" },
    { title: "Advanced", value: "expert" },
  ];

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          scrollEnabled={true} // Always allow scrolling
        >
          {/* Header */}
          <View className="px-6 py-6 border-b border-gray-100">
            <Text className="text-2xl font-bold text-gray-900">
              Edit Profile
            </Text>
          </View>

          {/* Basic Information */}
          <SectionHeader title="Basic Information" />
          <View className="bg-white">
            <SettingRowWithDropdown
              title="Gender"
              value={formatGender(profileData.gender)}
              dropdownKey="gender"
              dropdownOptions={genderOptions}
            />
            <SettingRowWithDropdown
              title="Date of Birth"
              value={
                profileData.date_of_birth
                  ? new Date(profileData.date_of_birth).toLocaleDateString()
                  : "Not set"
              }
              onPress={handleDateOfBirthPress}
            />
            <SettingRowWithDropdown
              title="Height"
              value={profileData.height_value}
              unit={profileData.height_unit === "metric" ? "cm" : "ft"}
              onPress={handleHeightPress}
            />
            <SettingRowWithDropdown
              title="Weight"
              value={profileData.weight_value}
              unit={profileData.weight_unit === "metric" ? "kg" : "lbs"}
              onPress={handleWeightPress}
            />
          </View>

          {/* Goals & Preferences */}
          <SectionHeader title="Goals & Preferences" />
          <View className="bg-white">
            <SettingRowWithDropdown
              title="Main Goal"
              value={formatGoal(profileData.main_goal)}
              dropdownKey="goal"
              dropdownOptions={goalOptions}
            />
            <SettingRowWithDropdown
              title="Activity Level"
              value={formatActivityLevel(profileData.activity_level)}
              dropdownKey="activity"
              dropdownOptions={activityOptions}
            />
            <SettingRowWithDropdown
              title="Dietary Preference"
              value={formatDietaryPreference(profileData.dietary_preference)}
              dropdownKey="diet"
              dropdownOptions={dietOptions}
            />
          </View>

          {/* Experience */}
          <SectionHeader title="Experience" />
          <View className="bg-white">
            <SettingRowWithDropdown
              title="Experience Level"
              value={formatExperienceLevel(profileData.experience_level)}
              dropdownKey="experience"
              dropdownOptions={experienceOptions}
            />
            <SettingRowWithDropdown
              title="Tracking Difficulty"
              value={formatTrackingDifficulty(profileData.tracking_difficulty)}
              dropdownKey="tracking"
              dropdownOptions={trackingOptions}
            />
          </View>

          {/* Save Button */}
          <View className="px-6 py-8">
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={isLoading}
              className="bg-black rounded-2xl py-4 flex-row items-center justify-center"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>

      {/* Recalculation Modal */}
      <Modal
        visible={showRecalculationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRecalculationModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
              Profile Updated Successfully!
            </Text>
            <Text className="text-gray-600 mb-6 text-center">
              Would you like to recalculate your daily calorie, protein, carbs,
              and fat targets based on your updated information?
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleSkipRecalculation}
                className="flex-1 bg-gray-200 rounded-xl py-3"
              >
                <Text className="text-gray-900 font-semibold text-center">
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRecalculateTargets}
                className="flex-1 bg-black rounded-xl py-3"
              >
                <Text className="text-white font-semibold text-center">
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EditProfileScreen;
